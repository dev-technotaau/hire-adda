import type { Request, Response, NextFunction } from 'express';
import { webauthnService } from '../services/webauthn.service';
import { generateTokens } from '../services/auth.service';
import { verifyMfaToken } from '../services/mfa.service';

import { AppError } from '../middleware/error';
import { publishEvent, KafkaTopics } from '../kafka/producer';
import { trackEvent, getClientId } from '../services/analytics.service';
import { setTokenCookies } from '../utils/cookie-helpers';
import prisma from '../config/prisma';

function getSessionId(req: Request): string {
  return req.id || req.ip || 'unknown';
}

/**
 * POST /api/v1/webauthn/register/options
 * Generate registration options for the authenticated user.
 */
export const getRegistrationOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const options = await webauthnService.generateRegistrationOptions(
      user.id,
      user.email,
      getSessionId(req)
    );

    res.status(200).json({
      status: 'success',
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/webauthn/register/verify
 * Verify and store a registration credential.
 */
export const verifyRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { credential, friendlyName } = req.body;

    const result = await webauthnService.verifyRegistration(
      user.id,
      credential,
      getSessionId(req),
      friendlyName
    );

    res.status(201).json({
      status: 'success',
      message: 'Passkey registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/webauthn/login/options
 * Generate authentication options (public — discoverable credentials).
 */
export const getAuthenticationOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let userId: string | undefined;

    if (req.body?.email) {
      const user = await prisma.user.findUnique({
        where: { email: req.body.email },
        select: { id: true },
      });
      userId = user?.id;
    }

    const options = await webauthnService.generateAuthenticationOptions(getSessionId(req), userId);

    res.status(200).json({
      status: 'success',
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/webauthn/login/verify
 * Verify authentication and return JWT tokens.
 */
export const verifyAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential, mfaCode } = req.body;
    const { verified, user } = await webauthnService.verifyAuthentication(
      credential,
      getSessionId(req)
    );

    if (!verified || !user) {
      throw new AppError('Authentication failed', 401, 'WEBAUTHN_AUTH_FAILED');
    }

    if (!user.isActive || user.isSuspended) {
      throw new AppError('Account is suspended or inactive', 403, 'ACCOUNT_SUSPENDED');
    }

    // Check if user has MFA enabled — passkeys don't bypass TOTP
    const mfaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true },
    });

    if (mfaUser?.mfaEnabled) {
      if (!mfaCode) {
        // Return MFA required response (no tokens yet)
        res.status(200).json({
          status: 'success',
          message: 'MFA required',
          data: {
            requireMfa: true,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              firstName: user.firstName,
              lastName: user.lastName,
            },
          },
        });
        return;
      }
      const isMfaValid = await verifyMfaToken(user.id, mfaCode);
      if (!isMfaValid) {
        throw new AppError('Invalid MFA code', 401);
      }
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    const tokens = await generateTokens(user, userAgent, ipAddress);

    // Set httpOnly cookies (session already created inside generateTokens)
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken, true, tokens.sessionId);

    publishEvent(KafkaTopics.USER_LOGIN, user.id, {
      userId: user.id,
      email: user.email,
      method: 'webauthn',
    });
    trackEvent(getClientId(user.id), { name: 'login', params: { method: 'webauthn' } }).catch(
      () => {}
    );

    res.status(200).json({
      status: 'success',
      message: 'Logged in with passkey',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: tokens.sessionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/webauthn/credentials
 * List the authenticated user's passkeys.
 */
export const listCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const credentials = await webauthnService.listCredentials(user.id);

    res.status(200).json({
      status: 'success',
      data: credentials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/webauthn/credentials/:id
 * Remove a passkey.
 */
export const deleteCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const credentialId = req.params.id as string;

    await webauthnService.deleteCredential(user.id, credentialId);

    res.status(200).json({
      status: 'success',
      message: 'Passkey removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
