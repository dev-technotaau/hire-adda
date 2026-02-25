# Verification System Analysis

## ✅ **Already Implemented (95% Complete)**

### **1. Database Schema** ✅
- **VerificationRequest model** with all fields:
  - `type`: GST, EMPLOYMENT, IDENTITY
  - `status`: PENDING, APPROVED, REJECTED, REQUESTED_CHANGES
  - `documentUrl`, `data` (JSON for extra info like GST number)
  - Admin review fields: `reviewedBy`, `reviewedAt`, `adminComments`
  - Escalation: `escalatedAt`, `escalatedBy`, `escalationReason`, `priority`
  - SLA: `slaDeadline`, `approvalChain`, `currentApprovalLevel`

### **2. Backend Services** ✅
**`verification.service.ts`:**
- ✅ `requestVerification()` - User requests verification
- ✅ `getPendingVerifications()` - Admin gets pending requests
- ✅ `reviewVerification()` - Admin approves/rejects
- ✅ `getUserVerifications()` - User gets own requests
- ✅ `getAllVerifications()` - Admin gets all with filters
- ✅ `getVerificationStats()` - Statistics (by status, by type)

**Features:**
- Checks for duplicate pending requests
- Uploads documents to R2
- Updates `companyProfile.isVerified` when GST approved
- Returns paginated results with filters

### **3. Backend Routes** ✅
**`verification.routes.ts`:**
- `POST /api/v1/verifications` - Request verification
- `GET /api/v1/verifications/mine` - Get user's verifications
- `GET /api/v1/verifications` - Admin: Get all (with filters)
- `GET /api/v1/verifications/pending` - Admin: Get pending
- `GET /api/v1/verifications/stats` - Admin: Statistics
- `PUT /api/v1/verifications/:id/review` - Admin: Review

### **4. Frontend - Employer Verification Page** ✅
**`frontend/src/app/employer/verification/page.tsx`:**
- ✅ Form to request GST/EMPLOYMENT/IDENTITY verification
- ✅ GST number input field
- ✅ Document upload
- ✅ Shows all user's verification requests with status badges
- ✅ Status: PENDING (warning), APPROVED (success), REJECTED (error)

### **5. Frontend - Candidate Verification Page** ✅
**`frontend/src/app/candidate/verification/page.tsx`:**
- ✅ Form to request EMPLOYMENT/IDENTITY verification
- ✅ Document upload
- ✅ Shows verification history

### **6. Frontend - Admin Verification Review Page** ✅
**`frontend/src/app/admin/verifications/page.tsx`:**
- ✅ **Full verification management dashboard**
- ✅ Filters: Status (PENDING/APPROVED/REJECTED), Type (GST/EMPLOYMENT/IDENTITY)
- ✅ Pagination
- ✅ **Review modal** (Approve/Reject with comments)
- ✅ **Escalation modal** (Escalate with reason)
- ✅ **Employment contact modal** (Send verification email to employer)
- ✅ **SLA tracking modal** (Set deadline)
- ✅ **Statistics cards** (by status, by type)
- ✅ Shows:
  - User details (name, email, role, company name, GST number)
  - Document download link
  - Submission date
  - Review status and reviewer
  - Priority badges

### **7. User Notifications** ✅
**When user submits verification:**
- ✅ In-app notification
- ✅ FCM push notification
- ✅ Web push notification

**When admin reviews verification (approved/rejected):**
- ✅ Email notification (with proper template)
- ✅ SMS notification
- ✅ WhatsApp notification
- ✅ In-app notification
- ✅ FCM push notification
- ✅ Web push notification

**Notification details:**
- ✅ Includes verification type (GST, EMPLOYMENT, IDENTITY)
- ✅ Includes status (approved/rejected)
- ✅ Includes admin comments if any
- ✅ Multi-channel (all 6 channels)

---

## ❌ **Missing (5% - Admin Notifications Only)**

### **1. Admin/Super Admin Notifications When New Verification Request Submitted** ❌

**Currently:** When employer/candidate submits verification request, only the USER gets notified. Admins have NO notification.

**Missing:**
- ❌ Email notification to all ADMIN and SUPER_ADMIN users
- ❌ SMS notification to admins (optional, can be turned off via preferences)
- ❌ WhatsApp notification to admins
- ❌ In-app notification to admins
- ❌ FCM push notification to admins
- ❌ Web push notification to admins

**Should include:**
- Verification type (GST, EMPLOYMENT, IDENTITY)
- User name and email
- Company name (for GST/employer verifications)
- Link to admin verification page

### **2. Admin/Super Admin Notifications for SLA Breach** ❌

**Currently:** No automated notifications when SLA deadline is approaching or breached.

**Missing:**
- ❌ Notification 24 hours before SLA deadline
- ❌ Notification when SLA deadline is breached
- ❌ Escalation notifications to SUPER_ADMIN

---

## Implementation Plan for Missing Features

### **Phase 1: Admin Notification on New Verification Request** (30 minutes)

#### 1. Add notification function to `notification.service.ts`

```typescript
/**
 * Notify all admins about new verification request
 */
async notifyAdminsNewVerification(
    userId: string,
    verificationType: string,
    requestId: string
): Promise<void> {
    // Get user details
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyProfile: { select: { companyName: true } },
        },
    });

    if (!user) return;

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const companyInfo = user.companyProfile?.companyName ? ` from ${user.companyProfile.companyName}` : '';
    const userRole = user.role === 'EMPLOYER' ? 'Employer' : 'Candidate';

    // Get all admin and super admin users
    const admins = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            isActive: true,
        },
        select: {
            id: true,
            email: true,
            mobileNumber: true,
            whatsappNumber: true,
            isEmailVerified: true,
            isWhatsappVerified: true,
        },
    });

    // Notify each admin
    for (const admin of admins) {
        const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
        let emailOptions;
        let whatsappOptions;
        let smsOptions;

        // Email notification
        if (admin.isEmailVerified) {
            channels.push('email');
            const tmpl = verificationRequestReceivedEmailTemplate(
                verificationType,
                userName,
                userRole,
                companyInfo
            );
            emailOptions = {
                to: admin.email,
                subject: tmpl.subject,
                html: tmpl.html,
                text: tmpl.text,
            };
        }

        // WhatsApp notification
        const whatsappTarget = admin.whatsappNumber || admin.mobileNumber;
        if (admin.isWhatsappVerified && whatsappTarget) {
            channels.push('whatsapp');
            whatsappOptions = {
                to: whatsappTarget,
                templateName: 'admin_alert',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: `${verificationType} verification request from ${userName}` },
                        ],
                    },
                ],
            };
        }

        // SMS notification (optional, controlled by admin preferences)
        if (admin.mobileNumber) {
            smsOptions = {
                to: admin.mobileNumber,
                body: `New ${verificationType} verification request from ${userName}${companyInfo}. Review at Talent Bridge admin panel.`,
            };
            // Will be filtered by preferences
            channels.push('sms');
        }

        await this.send({
            userId: admin.id,
            title: 'New Verification Request',
            message: `${userRole} ${userName}${companyInfo} submitted ${verificationType} verification request.`,
            type: NotificationType.INFO,
            category: 'admin',
            link: '/admin/verifications',
            metadata: { requestId, verificationType, submitterId: userId },
            channels,
            emailOptions,
            whatsappOptions,
            smsOptions,
        });
    }
}
```

#### 2. Add email template

Create `backend/src/templates/email/admin-verification.ts`:

```typescript
export function verificationRequestReceivedEmailTemplate(
    verificationType: string,
    userName: string,
    userRole: string,
    companyInfo: string
) {
    return {
        subject: `New ${verificationType} Verification Request - Action Required`,
        html: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#6366F1;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px}.info-box{background:white;padding:15px;margin:15px 0;border-left:4px solid #6366F1;border-radius:4px}.button{display:inline-block;background:#6366F1;color:white!important;padding:12px 24px;text-decoration:none;border-radius:6px;margin:15px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:20px}</style></head>
<body>
<div class="container">
<div class="header"><h2>🔔 New Verification Request</h2></div>
<div class="content">
<p>Hello Admin,</p>
<p>A new <strong>${verificationType}</strong> verification request has been submitted and requires your review.</p>
<div class="info-box">
<p><strong>User:</strong> ${userName} (${userRole})</p>
${companyInfo ? `<p><strong>Company:</strong> ${companyInfo.replace(' from ', '')}</p>` : ''}
<p><strong>Verification Type:</strong> ${verificationType}</p>
<p><strong>Status:</strong> Pending Review</p>
</div>
<p>Please review this request at your earliest convenience to ensure timely processing.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://talentbridge.com'}/admin/verifications" class="button">Review Verification</a>
<p style="margin-top:20px;color:#666;font-size:14px">⚡ Quick action required to maintain SLA compliance.</p>
</div>
<div class="footer"><p>Talent Bridge Admin Notifications<br>Do not reply to this email.</p></div>
</div>
</body>
</html>
        `.trim(),
        text: `New ${verificationType} Verification Request\n\nUser: ${userName} (${userRole})\n${companyInfo ? `Company: ${companyInfo.replace(' from ', '')}\n` : ''}Verification Type: ${verificationType}\nStatus: Pending Review\n\nPlease review at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://talentbridge.com'}/admin/verifications`,
    };
}
```

#### 3. Update `verification.service.ts`

In `requestVerification` method, after line 48, add:

```typescript
// Notify admins about new verification request
import('./notification.service').then(({ notificationService }) => {
    notificationService.notifyAdminsNewVerification(userId, type, request.id).catch(() => {});
});
```

---

### **Phase 2: SLA Breach Notifications** (Optional - 1 hour)

**Option 1:** Add to existing `sla-check.worker.ts`
**Option 2:** Create new worker for verification SLA monitoring

---

## Summary

### ✅ **What EXISTS (95%)**
1. ✅ Complete database schema
2. ✅ Full backend service with all operations
3. ✅ Backend routes and controllers
4. ✅ Employer GST/business verification page
5. ✅ Candidate identity/employment verification page
6. ✅ Admin verification review dashboard (full-featured)
7. ✅ Multi-channel notifications to users (submit + review)
8. ✅ Email templates for user notifications

### ❌ **What's MISSING (5%)**
1. ❌ **Admin notifications when new verification request submitted** (30 min fix)
2. ❌ SLA breach notifications (optional)

---

## Conclusion

**The verification system is 95% complete.** The only missing piece is admin notifications when new verification requests come in. Everything else — database, services, routes, frontend pages, user notifications — is already fully implemented.

**False Positive Warning:** The system is NOT missing employer verification pages or candidate verification pages. These already exist and are fully functional.
