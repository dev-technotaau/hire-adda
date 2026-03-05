--
-- PostgreSQL database dump
--

\restrict LpLpdu1h6RnzgydLtnUTtqGGhTxk42EOK7l8orpQXKlv43Jrgg9lVj8kGSQrrvi

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."WebhookEndpoint" DROP CONSTRAINT IF EXISTS "WebhookEndpoint_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."WebhookDelivery" DROP CONSTRAINT IF EXISTS "WebhookDelivery_webhookId_fkey";
ALTER TABLE IF EXISTS ONLY public."WebAuthnCredential" DROP CONSTRAINT IF EXISTS "WebAuthnCredential_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."VerificationRequest" DROP CONSTRAINT IF EXISTS "VerificationRequest_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."VerificationRequest" DROP CONSTRAINT IF EXISTS "VerificationRequest_reviewedBy_fkey";
ALTER TABLE IF EXISTS ONLY public."UserConsent" DROP CONSTRAINT IF EXISTS "UserConsent_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."TicketMessage" DROP CONSTRAINT IF EXISTS "TicketMessage_ticketId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ScreeningQuestion" DROP CONSTRAINT IF EXISTS "ScreeningQuestion_jobId_fkey";
ALTER TABLE IF EXISTS ONLY public."ScreeningAnswer" DROP CONSTRAINT IF EXISTS "ScreeningAnswer_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ScreeningAnswer" DROP CONSTRAINT IF EXISTS "ScreeningAnswer_applicationId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedSearch" DROP CONSTRAINT IF EXISTS "SavedSearch_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedJob" DROP CONSTRAINT IF EXISTS "SavedJob_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedJob" DROP CONSTRAINT IF EXISTS "SavedJob_jobId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedCandidate" DROP CONSTRAINT IF EXISTS "SavedCandidate_employerId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedCandidate" DROP CONSTRAINT IF EXISTS "SavedCandidate_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_sessionId_fkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_viewerId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_profileUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."MfaTrustedDevice" DROP CONSTRAINT IF EXISTS "MfaTrustedDevice_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."LoginLocation" DROP CONSTRAINT IF EXISTS "LoginLocation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."KnownDevice" DROP CONSTRAINT IF EXISTS "KnownDevice_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobTemplate" DROP CONSTRAINT IF EXISTS "JobTemplate_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobPost" DROP CONSTRAINT IF EXISTS "JobPost_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobCandidateMatch" DROP CONSTRAINT IF EXISTS "JobCandidateMatch_jobId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobCandidateMatch" DROP CONSTRAINT IF EXISTS "JobCandidateMatch_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobApplication" DROP CONSTRAINT IF EXISTS "JobApplication_jobId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobApplication" DROP CONSTRAINT IF EXISTS "JobApplication_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobAlert" DROP CONSTRAINT IF EXISTS "JobAlert_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FormDraft" DROP CONSTRAINT IF EXISTS "FormDraft_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DismissedRecommendation" DROP CONSTRAINT IF EXISTS "DismissedRecommendation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DismissedRecommendation" DROP CONSTRAINT IF EXISTS "DismissedRecommendation_jobId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeviceToken" DROP CONSTRAINT IF EXISTS "DeviceToken_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CompanyProfile" DROP CONSTRAINT IF EXISTS "CompanyProfile_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateProfile" DROP CONSTRAINT IF EXISTS "CandidateProfile_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateList" DROP CONSTRAINT IF EXISTS "CandidateList_employerId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateListMember" DROP CONSTRAINT IF EXISTS "CandidateListMember_listId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateListMember" DROP CONSTRAINT IF EXISTS "CandidateListMember_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateListMember" DROP CONSTRAINT IF EXISTS "CandidateListMember_addedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_performedBy_fkey";
DROP INDEX IF EXISTS public."WebhookEndpoint_userId_idx";
DROP INDEX IF EXISTS public."WebhookEndpoint_isActive_idx";
DROP INDEX IF EXISTS public."WebhookDelivery_webhookId_idx";
DROP INDEX IF EXISTS public."WebhookDelivery_createdAt_idx";
DROP INDEX IF EXISTS public."WebAuthnCredential_userId_idx";
DROP INDEX IF EXISTS public."WebAuthnCredential_credentialId_key";
DROP INDEX IF EXISTS public."VerificationRequest_userId_idx";
DROP INDEX IF EXISTS public."VerificationRequest_type_status_idx";
DROP INDEX IF EXISTS public."VerificationRequest_type_idx";
DROP INDEX IF EXISTS public."VerificationRequest_status_idx";
DROP INDEX IF EXISTS public."VerificationRequest_priority_idx";
DROP INDEX IF EXISTS public."User_role_idx";
DROP INDEX IF EXISTS public."User_passwordResetToken_idx";
DROP INDEX IF EXISTS public."User_mobileNumber_key";
DROP INDEX IF EXISTS public."User_linkedinId_key";
DROP INDEX IF EXISTS public."User_googleId_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_email_idx";
DROP INDEX IF EXISTS public."User_emailVerificationToken_idx";
DROP INDEX IF EXISTS public."UserConsent_userId_idx";
DROP INDEX IF EXISTS public."UserConsent_type_idx";
DROP INDEX IF EXISTS public."TicketMessage_ticketId_createdAt_idx";
DROP INDEX IF EXISTS public."SystemConfig_key_key";
DROP INDEX IF EXISTS public."SupportTicket_userId_idx";
DROP INDEX IF EXISTS public."SupportTicket_ticketNumber_key";
DROP INDEX IF EXISTS public."SupportTicket_ticketNumber_idx";
DROP INDEX IF EXISTS public."SupportTicket_status_idx";
DROP INDEX IF EXISTS public."SupportTicket_createdAt_idx";
DROP INDEX IF EXISTS public."SupportTicket_category_idx";
DROP INDEX IF EXISTS public."SupportTicket_assignedToId_idx";
DROP INDEX IF EXISTS public."Session_userId_isActive_idx";
DROP INDEX IF EXISTS public."Session_userId_idx";
DROP INDEX IF EXISTS public."Session_isActive_idx";
DROP INDEX IF EXISTS public."ScreeningQuestion_jobId_idx";
DROP INDEX IF EXISTS public."ScreeningQuestion_jobId_displayOrder_idx";
DROP INDEX IF EXISTS public."ScreeningAnswer_questionId_idx";
DROP INDEX IF EXISTS public."ScreeningAnswer_applicationId_questionId_key";
DROP INDEX IF EXISTS public."ScreeningAnswer_applicationId_idx";
DROP INDEX IF EXISTS public."SavedSearch_userId_searchType_idx";
DROP INDEX IF EXISTS public."SavedJob_userId_jobId_key";
DROP INDEX IF EXISTS public."SavedJob_userId_idx";
DROP INDEX IF EXISTS public."SavedCandidate_employerId_idx";
DROP INDEX IF EXISTS public."SavedCandidate_employerId_candidateId_key";
DROP INDEX IF EXISTS public."SavedCandidate_candidateId_idx";
DROP INDEX IF EXISTS public."RefreshToken_userId_idx";
DROP INDEX IF EXISTS public."RefreshToken_token_key";
DROP INDEX IF EXISTS public."RefreshToken_token_idx";
DROP INDEX IF EXISTS public."RefreshToken_sessionId_idx";
DROP INDEX IF EXISTS public."RefreshToken_expiresAt_idx";
DROP INDEX IF EXISTS public."PushSubscription_userId_idx";
DROP INDEX IF EXISTS public."PushSubscription_endpoint_key";
DROP INDEX IF EXISTS public."ProfileView_viewerId_idx";
DROP INDEX IF EXISTS public."ProfileView_profileUserId_createdAt_idx";
DROP INDEX IF EXISTS public."Notification_userId_isRead_idx";
DROP INDEX IF EXISTS public."Notification_userId_isRead_createdAt_idx";
DROP INDEX IF EXISTS public."Notification_userId_createdAt_idx";
DROP INDEX IF EXISTS public."Notification_createdAt_idx";
DROP INDEX IF EXISTS public."MfaTrustedDevice_userId_idx";
DROP INDEX IF EXISTS public."MfaTrustedDevice_tokenHash_key";
DROP INDEX IF EXISTS public."MfaTrustedDevice_expiresAt_idx";
DROP INDEX IF EXISTS public."LoginLocation_userId_idx";
DROP INDEX IF EXISTS public."LoginLocation_createdAt_idx";
DROP INDEX IF EXISTS public."KnownDevice_userId_idx";
DROP INDEX IF EXISTS public."KnownDevice_userId_fingerprint_key";
DROP INDEX IF EXISTS public."JobTemplate_companyId_name_idx";
DROP INDEX IF EXISTS public."JobTemplate_companyId_idx";
DROP INDEX IF EXISTS public."JobPost_workMode_idx";
DROP INDEX IF EXISTS public."JobPost_urgencyLevel_idx";
DROP INDEX IF EXISTS public."JobPost_type_idx";
DROP INDEX IF EXISTS public."JobPost_title_idx";
DROP INDEX IF EXISTS public."JobPost_status_workMode_idx";
DROP INDEX IF EXISTS public."JobPost_status_type_idx";
DROP INDEX IF EXISTS public."JobPost_status_idx";
DROP INDEX IF EXISTS public."JobPost_status_expiresAt_idx";
DROP INDEX IF EXISTS public."JobPost_status_experienceLevel_idx";
DROP INDEX IF EXISTS public."JobPost_status_createdAt_idx";
DROP INDEX IF EXISTS public."JobPost_shiftType_idx";
DROP INDEX IF EXISTS public."JobPost_scheduledPublishAt_idx";
DROP INDEX IF EXISTS public."JobPost_referenceCode_idx";
DROP INDEX IF EXISTS public."JobPost_postingVisibility_idx";
DROP INDEX IF EXISTS public."JobPost_location_idx";
DROP INDEX IF EXISTS public."JobPost_latitude_longitude_idx";
DROP INDEX IF EXISTS public."JobPost_isFeatured_idx";
DROP INDEX IF EXISTS public."JobPost_isConfidential_idx";
DROP INDEX IF EXISTS public."JobPost_industry_idx";
DROP INDEX IF EXISTS public."JobPost_functionalArea_idx";
DROP INDEX IF EXISTS public."JobPost_expiresAt_idx";
DROP INDEX IF EXISTS public."JobPost_experienceLevel_idx";
DROP INDEX IF EXISTS public."JobPost_educationRequired_idx";
DROP INDEX IF EXISTS public."JobPost_companyId_status_idx";
DROP INDEX IF EXISTS public."JobPost_companyId_idx";
DROP INDEX IF EXISTS public."JobPost_companyId_createdAt_idx";
DROP INDEX IF EXISTS public."JobPost_applicationDeadline_idx";
DROP INDEX IF EXISTS public."JobCandidateMatch_notificationsSent_idx";
DROP INDEX IF EXISTS public."JobCandidateMatch_jobId_idx";
DROP INDEX IF EXISTS public."JobCandidateMatch_jobId_candidateId_key";
DROP INDEX IF EXISTS public."JobCandidateMatch_createdAt_idx";
DROP INDEX IF EXISTS public."JobCandidateMatch_candidateId_idx";
DROP INDEX IF EXISTS public."JobApplication_status_idx";
DROP INDEX IF EXISTS public."JobApplication_source_idx";
DROP INDEX IF EXISTS public."JobApplication_offeredAt_idx";
DROP INDEX IF EXISTS public."JobApplication_jobId_status_idx";
DROP INDEX IF EXISTS public."JobApplication_jobId_idx";
DROP INDEX IF EXISTS public."JobApplication_jobId_candidateId_key";
DROP INDEX IF EXISTS public."JobApplication_hiredAt_idx";
DROP INDEX IF EXISTS public."JobApplication_candidateId_status_idx";
DROP INDEX IF EXISTS public."JobApplication_candidateId_idx";
DROP INDEX IF EXISTS public."JobAlert_userId_isActive_idx";
DROP INDEX IF EXISTS public."JobAlert_isActive_frequency_idx";
DROP INDEX IF EXISTS public."FormDraft_userId_formType_name_key";
DROP INDEX IF EXISTS public."FormDraft_userId_formType_idx";
DROP INDEX IF EXISTS public."DismissedRecommendation_userId_jobId_key";
DROP INDEX IF EXISTS public."DismissedRecommendation_userId_idx";
DROP INDEX IF EXISTS public."DeviceToken_userId_idx";
DROP INDEX IF EXISTS public."DeviceToken_token_key";
DROP INDEX IF EXISTS public."ContactMessage_isRead_idx";
DROP INDEX IF EXISTS public."ContactMessage_createdAt_idx";
DROP INDEX IF EXISTS public."CompanyProfile_userId_key";
DROP INDEX IF EXISTS public."CompanyProfile_userId_idx";
DROP INDEX IF EXISTS public."CompanyProfile_latitude_longitude_idx";
DROP INDEX IF EXISTS public."CompanyProfile_industry_idx";
DROP INDEX IF EXISTS public."CompanyProfile_gstNumber_key";
DROP INDEX IF EXISTS public."CompanyProfile_fundingStage_idx";
DROP INDEX IF EXISTS public."CompanyProfile_companyType_idx";
DROP INDEX IF EXISTS public."CompanyProfile_companyName_idx";
DROP INDEX IF EXISTS public."CompanyProfile_city_state_idx";
DROP INDEX IF EXISTS public."CompanyProfile_cinNumber_key";
DROP INDEX IF EXISTS public."CandidateProfile_workStatus_noticePeriod_experienceYears_idx";
DROP INDEX IF EXISTS public."CandidateProfile_workStatus_idx";
DROP INDEX IF EXISTS public."CandidateProfile_willingToRelocate_idx";
DROP INDEX IF EXISTS public."CandidateProfile_userId_key";
DROP INDEX IF EXISTS public."CandidateProfile_userId_idx";
DROP INDEX IF EXISTS public."CandidateProfile_profileCompleteness_idx";
DROP INDEX IF EXISTS public."CandidateProfile_openToWork_idx";
DROP INDEX IF EXISTS public."CandidateProfile_noticePeriod_idx";
DROP INDEX IF EXISTS public."CandidateProfile_latitude_longitude_idx";
DROP INDEX IF EXISTS public."CandidateProfile_highestEducationLevel_idx";
DROP INDEX IF EXISTS public."CandidateProfile_highestDegree_idx";
DROP INDEX IF EXISTS public."CandidateProfile_functionalArea_idx";
DROP INDEX IF EXISTS public."CandidateProfile_experienceYears_idx";
DROP INDEX IF EXISTS public."CandidateProfile_experienceLevel_idx";
DROP INDEX IF EXISTS public."CandidateProfile_drivingLicenseType_idx";
DROP INDEX IF EXISTS public."CandidateProfile_currentLocation_idx";
DROP INDEX IF EXISTS public."CandidateProfile_currentIndustry_idx";
DROP INDEX IF EXISTS public."CandidateProfile_city_state_idx";
DROP INDEX IF EXISTS public."CandidateList_employerId_idx";
DROP INDEX IF EXISTS public."CandidateListMember_listId_idx";
DROP INDEX IF EXISTS public."CandidateListMember_listId_candidateId_key";
DROP INDEX IF EXISTS public."CandidateListMember_candidateId_idx";
DROP INDEX IF EXISTS public."AuditLog_performedBy_idx";
DROP INDEX IF EXISTS public."AuditLog_entity_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AuditLog_action_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."WebhookEndpoint" DROP CONSTRAINT IF EXISTS "WebhookEndpoint_pkey";
ALTER TABLE IF EXISTS ONLY public."WebhookDelivery" DROP CONSTRAINT IF EXISTS "WebhookDelivery_pkey";
ALTER TABLE IF EXISTS ONLY public."WebAuthnCredential" DROP CONSTRAINT IF EXISTS "WebAuthnCredential_pkey";
ALTER TABLE IF EXISTS ONLY public."VerificationRequest" DROP CONSTRAINT IF EXISTS "VerificationRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserConsent" DROP CONSTRAINT IF EXISTS "UserConsent_pkey";
ALTER TABLE IF EXISTS ONLY public."TicketMessage" DROP CONSTRAINT IF EXISTS "TicketMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."SystemConfig" DROP CONSTRAINT IF EXISTS "SystemConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."ScreeningQuestion" DROP CONSTRAINT IF EXISTS "ScreeningQuestion_pkey";
ALTER TABLE IF EXISTS ONLY public."ScreeningAnswer" DROP CONSTRAINT IF EXISTS "ScreeningAnswer_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedSearch" DROP CONSTRAINT IF EXISTS "SavedSearch_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedJob" DROP CONSTRAINT IF EXISTS "SavedJob_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedCandidate" DROP CONSTRAINT IF EXISTS "SavedCandidate_pkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_pkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_pkey";
ALTER TABLE IF EXISTS ONLY public."ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."MfaTrustedDevice" DROP CONSTRAINT IF EXISTS "MfaTrustedDevice_pkey";
ALTER TABLE IF EXISTS ONLY public."LoginLocation" DROP CONSTRAINT IF EXISTS "LoginLocation_pkey";
ALTER TABLE IF EXISTS ONLY public."KnownDevice" DROP CONSTRAINT IF EXISTS "KnownDevice_pkey";
ALTER TABLE IF EXISTS ONLY public."JobTemplate" DROP CONSTRAINT IF EXISTS "JobTemplate_pkey";
ALTER TABLE IF EXISTS ONLY public."JobPost" DROP CONSTRAINT IF EXISTS "JobPost_pkey";
ALTER TABLE IF EXISTS ONLY public."JobCandidateMatch" DROP CONSTRAINT IF EXISTS "JobCandidateMatch_pkey";
ALTER TABLE IF EXISTS ONLY public."JobApplication" DROP CONSTRAINT IF EXISTS "JobApplication_pkey";
ALTER TABLE IF EXISTS ONLY public."JobAlert" DROP CONSTRAINT IF EXISTS "JobAlert_pkey";
ALTER TABLE IF EXISTS ONLY public."FormDraft" DROP CONSTRAINT IF EXISTS "FormDraft_pkey";
ALTER TABLE IF EXISTS ONLY public."DismissedRecommendation" DROP CONSTRAINT IF EXISTS "DismissedRecommendation_pkey";
ALTER TABLE IF EXISTS ONLY public."DeviceToken" DROP CONSTRAINT IF EXISTS "DeviceToken_pkey";
ALTER TABLE IF EXISTS ONLY public."ContactMessage" DROP CONSTRAINT IF EXISTS "ContactMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."CompanyProfile" DROP CONSTRAINT IF EXISTS "CompanyProfile_pkey";
ALTER TABLE IF EXISTS ONLY public."CandidateProfile" DROP CONSTRAINT IF EXISTS "CandidateProfile_pkey";
ALTER TABLE IF EXISTS ONLY public."CandidateList" DROP CONSTRAINT IF EXISTS "CandidateList_pkey";
ALTER TABLE IF EXISTS ONLY public."CandidateListMember" DROP CONSTRAINT IF EXISTS "CandidateListMember_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."WebhookEndpoint";
DROP TABLE IF EXISTS public."WebhookDelivery";
DROP TABLE IF EXISTS public."WebAuthnCredential";
DROP TABLE IF EXISTS public."VerificationRequest";
DROP TABLE IF EXISTS public."UserConsent";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TicketMessage";
DROP TABLE IF EXISTS public."SystemConfig";
DROP TABLE IF EXISTS public."SupportTicket";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."ScreeningQuestion";
DROP TABLE IF EXISTS public."ScreeningAnswer";
DROP TABLE IF EXISTS public."SavedSearch";
DROP TABLE IF EXISTS public."SavedJob";
DROP TABLE IF EXISTS public."SavedCandidate";
DROP TABLE IF EXISTS public."RefreshToken";
DROP TABLE IF EXISTS public."PushSubscription";
DROP TABLE IF EXISTS public."ProfileView";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."MfaTrustedDevice";
DROP TABLE IF EXISTS public."LoginLocation";
DROP TABLE IF EXISTS public."KnownDevice";
DROP TABLE IF EXISTS public."JobTemplate";
DROP TABLE IF EXISTS public."JobPost";
DROP TABLE IF EXISTS public."JobCandidateMatch";
DROP TABLE IF EXISTS public."JobApplication";
DROP TABLE IF EXISTS public."JobAlert";
DROP TABLE IF EXISTS public."FormDraft";
DROP TABLE IF EXISTS public."DismissedRecommendation";
DROP TABLE IF EXISTS public."DeviceToken";
DROP TABLE IF EXISTS public."ContactMessage";
DROP TABLE IF EXISTS public."CompanyProfile";
DROP TABLE IF EXISTS public."CandidateProfile";
DROP TABLE IF EXISTS public."CandidateListMember";
DROP TABLE IF EXISTS public."CandidateList";
DROP TABLE IF EXISTS public."AuditLog";
DROP TYPE IF EXISTS public."WorkStatus";
DROP TYPE IF EXISTS public."WorkMode";
DROP TYPE IF EXISTS public."VerificationType";
DROP TYPE IF EXISTS public."VerificationStatus";
DROP TYPE IF EXISTS public."UrgencyLevel";
DROP TYPE IF EXISTS public."TicketStatus";
DROP TYPE IF EXISTS public."TicketSatisfaction";
DROP TYPE IF EXISTS public."TicketPriority";
DROP TYPE IF EXISTS public."TicketCategory";
DROP TYPE IF EXISTS public."SpecificDegree";
DROP TYPE IF EXISTS public."ShiftType";
DROP TYPE IF EXISTS public."ScreeningQuestionType";
DROP TYPE IF EXISTS public."SalaryType";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."ReservationCategory";
DROP TYPE IF EXISTS public."PostingVisibility";
DROP TYPE IF EXISTS public."PatentStatus";
DROP TYPE IF EXISTS public."OpenToWorkStatus";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."NoticePeriodPreference";
DROP TYPE IF EXISTS public."NoticePeriod";
DROP TYPE IF EXISTS public."MaritalStatus";
DROP TYPE IF EXISTS public."LanguageProficiency";
DROP TYPE IF EXISTS public."JobType";
DROP TYPE IF EXISTS public."JobStatus";
DROP TYPE IF EXISTS public."GenderPreference";
DROP TYPE IF EXISTS public."Gender";
DROP TYPE IF EXISTS public."FundingStage";
DROP TYPE IF EXISTS public."FunctionalArea";
DROP TYPE IF EXISTS public."FormDraftType";
DROP TYPE IF EXISTS public."ExperienceLevel";
DROP TYPE IF EXISTS public."EducationType";
DROP TYPE IF EXISTS public."EducationLevel";
DROP TYPE IF EXISTS public."DrivingLicenseType";
DROP TYPE IF EXISTS public."DisabilityType";
DROP TYPE IF EXISTS public."CompanyType";
DROP TYPE IF EXISTS public."CareerBreakType";
DROP TYPE IF EXISTS public."ApplyMethod";
DROP TYPE IF EXISTS public."ApplicationStatus";
DROP TYPE IF EXISTS public."AlertFrequency";
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: AlertFrequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertFrequency" AS ENUM (
    'INSTANT',
    'DAILY',
    'WEEKLY',
    'OFF'
);


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'APPLIED',
    'VIEWED',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'REJECTED',
    'OFFERED',
    'HIRED',
    'WITHDRAWN',
    'SELECTED'
);


--
-- Name: ApplyMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApplyMethod" AS ENUM (
    'IN_PLATFORM',
    'EXTERNAL_URL',
    'EMAIL',
    'WALK_IN'
);


--
-- Name: CareerBreakType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CareerBreakType" AS ENUM (
    'HEALTH',
    'FAMILY',
    'HIGHER_EDUCATION',
    'TRAVEL',
    'LAYOFF',
    'PERSONAL',
    'CAREGIVING',
    'CAREER_TRANSITION',
    'OTHER'
);


--
-- Name: CompanyType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CompanyType" AS ENUM (
    'PRIVATE',
    'PUBLIC',
    'STARTUP',
    'MNC',
    'GOVERNMENT',
    'NGO',
    'SEMI_GOVERNMENT'
);


--
-- Name: DisabilityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisabilityType" AS ENUM (
    'NONE',
    'VISUAL',
    'HEARING',
    'LOCOMOTOR',
    'INTELLECTUAL',
    'MULTIPLE',
    'OTHER'
);


--
-- Name: DrivingLicenseType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DrivingLicenseType" AS ENUM (
    'NONE',
    'TWO_WHEELER',
    'FOUR_WHEELER',
    'BOTH',
    'HEAVY_VEHICLE'
);


--
-- Name: EducationLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EducationLevel" AS ENUM (
    'TENTH',
    'TWELFTH',
    'DIPLOMA',
    'BACHELORS',
    'MASTERS',
    'PHD',
    'POST_DOCTORAL'
);


--
-- Name: EducationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EducationType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'DISTANCE',
    'CORRESPONDENCE'
);


--
-- Name: ExperienceLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExperienceLevel" AS ENUM (
    'FRESHER',
    'ENTRY',
    'MID',
    'SENIOR',
    'LEAD',
    'EXECUTIVE'
);


--
-- Name: FormDraftType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FormDraftType" AS ENUM (
    'CANDIDATE_PROFILE',
    'JOB_SEARCH_PREFERENCES',
    'CANDIDATE_SEARCH',
    'JOB_POSTING',
    'EMPLOYER_PROFILE'
);


--
-- Name: FunctionalArea; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FunctionalArea" AS ENUM (
    'IT_SOFTWARE',
    'IT_HARDWARE',
    'SALES',
    'MARKETING',
    'HR',
    'FINANCE',
    'ITES_BPO',
    'ENGINEERING',
    'PRODUCTION',
    'PHARMA',
    'BANKING',
    'LEGAL',
    'MEDIA',
    'HOSPITALITY',
    'RETAIL',
    'LOGISTICS',
    'EDUCATION',
    'HEALTHCARE',
    'REAL_ESTATE',
    'OTHER'
);


--
-- Name: FundingStage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FundingStage" AS ENUM (
    'BOOTSTRAPPED',
    'SEED',
    'SERIES_A',
    'SERIES_B',
    'SERIES_C',
    'SERIES_D_PLUS',
    'PRE_IPO',
    'PUBLIC',
    'ACQUIRED',
    'NOT_APPLICABLE'
);


--
-- Name: Gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'NON_BINARY',
    'PREFER_NOT_TO_SAY',
    'OTHER'
);


--
-- Name: GenderPreference; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GenderPreference" AS ENUM (
    'ANY',
    'MALE',
    'FEMALE',
    'OTHER'
);


--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JobStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'DRAFT',
    'EXPIRED'
);


--
-- Name: JobType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JobType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERNSHIP',
    'FREELANCE'
);


--
-- Name: LanguageProficiency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LanguageProficiency" AS ENUM (
    'BASIC',
    'INTERMEDIATE',
    'FLUENT',
    'NATIVE'
);


--
-- Name: MaritalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaritalStatus" AS ENUM (
    'SINGLE',
    'MARRIED',
    'DIVORCED',
    'WIDOWED',
    'PREFER_NOT_TO_SAY'
);


--
-- Name: NoticePeriod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NoticePeriod" AS ENUM (
    'IMMEDIATE',
    'FIFTEEN_DAYS',
    'THIRTY_DAYS',
    'SIXTY_DAYS',
    'NINETY_DAYS',
    'MORE_THAN_NINETY_DAYS'
);


--
-- Name: NoticePeriodPreference; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NoticePeriodPreference" AS ENUM (
    'IMMEDIATE',
    'FIFTEEN_DAYS',
    'ONE_MONTH',
    'TWO_MONTHS',
    'THREE_MONTHS',
    'NEGOTIABLE'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR'
);


--
-- Name: OpenToWorkStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OpenToWorkStatus" AS ENUM (
    'ACTIVELY_LOOKING',
    'OPEN_TO_OFFERS',
    'NOT_LOOKING'
);


--
-- Name: PatentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PatentStatus" AS ENUM (
    'FILED',
    'PUBLISHED',
    'GRANTED'
);


--
-- Name: PostingVisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PostingVisibility" AS ENUM (
    'PUBLIC',
    'INTERNAL',
    'BOTH'
);


--
-- Name: ReservationCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReservationCategory" AS ENUM (
    'GENERAL',
    'SC',
    'ST',
    'OBC',
    'EWS',
    'PREFER_NOT_TO_SAY'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CANDIDATE',
    'EMPLOYER',
    'ADMIN',
    'SUPER_ADMIN'
);


--
-- Name: SalaryType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SalaryType" AS ENUM (
    'ANNUAL',
    'MONTHLY',
    'HOURLY'
);


--
-- Name: ScreeningQuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ScreeningQuestionType" AS ENUM (
    'TEXT',
    'YES_NO',
    'MULTIPLE_CHOICE',
    'NUMERIC'
);


--
-- Name: ShiftType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShiftType" AS ENUM (
    'DAY',
    'NIGHT',
    'ROTATIONAL',
    'FLEXIBLE'
);


--
-- Name: SpecificDegree; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SpecificDegree" AS ENUM (
    'BTECH_BE',
    'BCA',
    'BSC',
    'BCOM',
    'BA',
    'BBA',
    'MBBS',
    'LLB',
    'BARCH',
    'BDES',
    'BPHARM',
    'DIPLOMA_ENGINEERING',
    'MCA',
    'MSC',
    'MCOM',
    'MA',
    'MBA_PGDM',
    'MTECH_ME',
    'MS',
    'LLM',
    'MD',
    'CA',
    'CS',
    'ICWA',
    'PHD',
    'ANY_GRADUATE',
    'ANY_POSTGRADUATE'
);


--
-- Name: TicketCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketCategory" AS ENUM (
    'GENERAL',
    'ACCOUNT',
    'BILLING',
    'TECHNICAL',
    'BUG_REPORT',
    'FEATURE_REQUEST',
    'JOB_POSTING',
    'APPLICATION',
    'VERIFICATION',
    'OTHER'
);


--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


--
-- Name: TicketSatisfaction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketSatisfaction" AS ENUM (
    'SATISFIED',
    'NEUTRAL',
    'NOT_SATISFIED'
);


--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'AWAITING_REPLY',
    'RESOLVED',
    'CLOSED'
);


--
-- Name: UrgencyLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UrgencyLevel" AS ENUM (
    'NORMAL',
    'URGENT',
    'IMMEDIATE'
);


--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REQUESTED_CHANGES'
);


--
-- Name: VerificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationType" AS ENUM (
    'GST',
    'EMPLOYMENT',
    'IDENTITY'
);


--
-- Name: WorkMode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WorkMode" AS ENUM (
    'ON_SITE',
    'REMOTE',
    'HYBRID'
);


--
-- Name: WorkStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WorkStatus" AS ENUM (
    'EMPLOYED',
    'UNEMPLOYED',
    'STUDENT',
    'FREELANCER',
    'ACTIVELY_LOOKING'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    "performedBy" text,
    details jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    checksum text,
    "isArchived" boolean DEFAULT false NOT NULL
);


--
-- Name: CandidateList; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CandidateList" (
    id text NOT NULL,
    "employerId" text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6366F1'::text,
    icon text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CandidateListMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CandidateListMember" (
    id text NOT NULL,
    "listId" text NOT NULL,
    "candidateId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "addedByUserId" text NOT NULL
);


--
-- Name: CandidateProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CandidateProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    dob timestamp(3) without time zone,
    bio text,
    resume text,
    "resumeOriginalName" text,
    "profileImage" text,
    "currentLocation" text,
    "preferredLocations" text[],
    phone text,
    "experienceYears" double precision DEFAULT 0 NOT NULL,
    "currentCompany" text,
    "currentRole" text,
    "currSalary" numeric(12,2),
    "expectedSalaryMin" numeric(12,2),
    "expectedSalaryMax" numeric(12,2),
    skills text[],
    languages text[],
    education jsonb,
    experience jsonb,
    "isPhysicallyChallenged" boolean DEFAULT false NOT NULL,
    "githubProfile" text,
    "linkedinProfile" text,
    "portfolioUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "addressLine1" text,
    "addressLine2" text,
    awards jsonb,
    "careerBreakReason" text,
    certifications jsonb,
    city text,
    country text DEFAULT 'India'::text,
    "currentDepartment" text,
    "currentIndustry" text,
    "dateOfAvailability" timestamp(3) without time zone,
    "disabilityPercentage" integer,
    "disabilityType" public."DisabilityType" DEFAULT 'NONE'::public."DisabilityType",
    "functionalArea" text,
    "hasCareerBreak" boolean DEFAULT false NOT NULL,
    headline text,
    hometown text,
    "languageProficiency" jsonb,
    latitude double precision,
    longitude double precision,
    "maritalStatus" public."MaritalStatus",
    nationality text DEFAULT 'Indian'::text,
    "personalBlogUrl" text,
    pincode text,
    "preferredIndustries" text[] DEFAULT ARRAY[]::text[],
    "preferredJobType" public."JobType"[] DEFAULT ARRAY[]::public."JobType"[],
    "preferredRoleCategories" text[] DEFAULT ARRAY[]::text[],
    "preferredShift" public."ShiftType",
    "preferredWorkMode" public."WorkMode"[] DEFAULT ARRAY[]::public."WorkMode"[],
    "profileCompleteness" integer DEFAULT 0 NOT NULL,
    projects jsonb,
    "salaryCurrency" text DEFAULT 'INR'::text NOT NULL,
    "servingNoticePeriod" boolean DEFAULT false NOT NULL,
    "skillsWithProficiency" jsonb,
    "stackOverflowProfile" text,
    state text,
    "totalExperienceMonths" integer,
    "travelWillingnessPercent" integer DEFAULT 0,
    "twitterProfile" text,
    "visaStatus" text,
    "willingToRelocate" boolean DEFAULT false,
    "workPermitStatus" text,
    "workStatus" public."WorkStatus" DEFAULT 'ACTIVELY_LOOKING'::public."WorkStatus",
    gender public."Gender",
    "noticePeriod" public."NoticePeriod",
    "additionalResumes" jsonb,
    "alternateEmail" text,
    "alternatePhone" text,
    "behanceProfile" text,
    "blockedCompanies" text[] DEFAULT ARRAY[]::text[],
    "careerBreakType" public."CareerBreakType",
    category public."ReservationCategory",
    courses jsonb,
    "dribbbleProfile" text,
    "hasDrivingLicense" boolean DEFAULT false NOT NULL,
    hobbies text[] DEFAULT ARRAY[]::text[],
    interests text[] DEFAULT ARRAY[]::text[],
    "isVeteran" boolean DEFAULT false NOT NULL,
    "itSkills" jsonb,
    "mediumProfile" text,
    "openToWork" public."OpenToWorkStatus",
    "ownVehicle" boolean DEFAULT false NOT NULL,
    "parsedResumeData" jsonb,
    "passportExpiryDate" timestamp(3) without time zone,
    "passportNumber" text,
    patents jsonb,
    "professionalMemberships" jsonb,
    pronouns text,
    publications jsonb,
    "references" jsonb,
    "testScores" jsonb,
    "videoResumeUrl" text,
    "volunteerExperience" jsonb,
    "youtubeChannel" text,
    "generatedResumeAt" timestamp(3) without time zone,
    "generatedResumeUrl" text,
    "notificationPreferences" jsonb,
    "drivingLicenseType" public."DrivingLicenseType" DEFAULT 'NONE'::public."DrivingLicenseType",
    "experienceLevel" public."ExperienceLevel",
    "highestDegree" public."SpecificDegree",
    "highestEducationLevel" public."EducationLevel",
    "resumeMimeType" text,
    "resumeSize" integer,
    "resumeUploadedAt" timestamp(3) without time zone
);


--
-- Name: CompanyProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CompanyProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    logo text,
    industry text,
    "companySize" text,
    description text,
    website text,
    "foundedYear" integer,
    headquarters text,
    locations text[],
    "gstNumber" text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "addressLine1" text,
    "addressLine2" text,
    "annualRevenueRange" text,
    "awardsRecognitions" jsonb,
    benefits text[] DEFAULT ARRAY[]::text[],
    "cinNumber" text,
    city text,
    "companyCulture" text,
    "companyType" public."CompanyType",
    "contactEmail" text,
    "contactPhone" text,
    country text DEFAULT 'India'::text,
    "coverImage" text,
    "diversityStatement" text,
    "employeeCount" integer,
    latitude double precision,
    longitude double precision,
    "missionStatement" text,
    "panNumber" text,
    pincode text,
    "socialLinks" jsonb,
    state text,
    "structuredPerks" jsonb,
    tagline text,
    "techStack" text[] DEFAULT ARRAY[]::text[],
    "visionStatement" text,
    "workplacePolicies" jsonb,
    "blogUrl" text,
    "careersPageUrl" text,
    "contactPersonDesignation" text,
    "contactPersonName" text,
    "coreValues" text[] DEFAULT ARRAY[]::text[],
    "csrInitiatives" text,
    "employeeResourceGroups" text[] DEFAULT ARRAY[]::text[],
    "employeeTestimonials" jsonb,
    "fundingStage" public."FundingStage",
    "interviewProcess" text,
    investors text[] DEFAULT ARRAY[]::text[],
    "leadershipTeam" jsonb,
    "officePhotos" jsonb,
    "parentCompany" text,
    "productsServices" text[] DEFAULT ARRAY[]::text[],
    specialties text[] DEFAULT ARRAY[]::text[],
    "stockTicker" text,
    "subIndustry" text,
    "totalFundingRaised" text,
    "whyWorkForUs" text,
    "notificationPreferences" jsonb,
    "companyVideoUrl" text,
    "numberOfOffices" integer
);


--
-- Name: ContactMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContactMessage" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "repliedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DeviceToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeviceToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    platform text,
    "deviceName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DismissedRecommendation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DismissedRecommendation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FormDraft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FormDraft" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "formType" public."FormDraftType" NOT NULL,
    data jsonb NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: JobAlert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JobAlert" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    filters jsonb NOT NULL,
    frequency public."AlertFrequency" DEFAULT 'DAILY'::public."AlertFrequency" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastNotifiedAt" timestamp(3) without time zone,
    "newMatchCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: JobApplication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JobApplication" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "candidateId" text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    "coverLetter" text,
    "resumeSnapshot" text,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "candidateNotes" text,
    "hiredAt" timestamp(3) without time zone,
    "interviewDate" timestamp(3) without time zone,
    "interviewFeedback" jsonb,
    "interviewNotes" text,
    "matchScore" double precision,
    "offerDetails" jsonb,
    "offeredAt" timestamp(3) without time zone,
    "rejectionReason" text,
    source text,
    "viewedAt" timestamp(3) without time zone,
    "selectedAt" timestamp(3) without time zone
);


--
-- Name: JobCandidateMatch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JobCandidateMatch" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "candidateId" text NOT NULL,
    "matchScore" double precision,
    "notificationsSent" boolean DEFAULT false NOT NULL,
    "emailSent" boolean DEFAULT false NOT NULL,
    "smsSent" boolean DEFAULT false NOT NULL,
    "pushSent" boolean DEFAULT false NOT NULL,
    "whatsappSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "notifiedAt" timestamp(3) without time zone
);


--
-- Name: JobPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JobPost" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    requirements text,
    benefits text,
    type public."JobType" DEFAULT 'FULL_TIME'::public."JobType" NOT NULL,
    status public."JobStatus" DEFAULT 'OPEN'::public."JobStatus" NOT NULL,
    industry text,
    department text,
    "roleCategory" text,
    location text NOT NULL,
    "isRemote" boolean DEFAULT false NOT NULL,
    "salaryMin" numeric(12,2),
    "salaryMax" numeric(12,2),
    currency text DEFAULT 'INR'::text NOT NULL,
    "experienceMin" integer DEFAULT 0 NOT NULL,
    "experienceMax" integer,
    "skillsRequired" text[],
    views integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "applicationDeadline" timestamp(3) without time zone,
    "certificationsRequired" text[] DEFAULT ARRAY[]::text[],
    "closedAt" timestamp(3) without time zone,
    "closedReason" text,
    "contactEmail" text,
    "contactPerson" text,
    "educationRequired" public."EducationLevel",
    "experienceLevel" public."ExperienceLevel",
    "interviewProcess" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "isWalkIn" boolean DEFAULT false NOT NULL,
    "jobPerks" text[] DEFAULT ARRAY[]::text[],
    "keyResponsibilities" text,
    "languagesRequired" jsonb,
    latitude double precision,
    longitude double precision,
    "niceToHaveSkills" text[] DEFAULT ARRAY[]::text[],
    "numberOfOpenings" integer DEFAULT 1,
    "preferredEducationField" text,
    "relocationAssistance" boolean DEFAULT false NOT NULL,
    "salaryDisclosed" boolean DEFAULT true NOT NULL,
    "salaryType" public."SalaryType" DEFAULT 'ANNUAL'::public."SalaryType",
    "shiftType" public."ShiftType",
    tags text[] DEFAULT ARRAY[]::text[],
    "travelRequirementPercent" integer DEFAULT 0,
    "urgencyLevel" public."UrgencyLevel" DEFAULT 'NORMAL'::public."UrgencyLevel",
    "walkInDetails" jsonb,
    "workMode" public."WorkMode" DEFAULT 'ON_SITE'::public."WorkMode",
    "accommodationProvided" boolean DEFAULT false NOT NULL,
    "additionalLocations" text[] DEFAULT ARRAY[]::text[],
    "ageMax" integer,
    "ageMin" integer,
    "applyMethod" public."ApplyMethod" DEFAULT 'IN_PLATFORM'::public."ApplyMethod" NOT NULL,
    "backgroundCheckRequired" boolean DEFAULT false NOT NULL,
    "bondDetails" text,
    "degreeSpecializations" text[] DEFAULT ARRAY[]::text[],
    "diversityTags" text[] DEFAULT ARRAY[]::text[],
    "drivingLicenseRequired" public."DrivingLicenseType",
    "externalApplyUrl" text,
    "functionalArea" public."FunctionalArea",
    "genderPreference" public."GenderPreference" DEFAULT 'ANY'::public."GenderPreference",
    "isConfidential" boolean DEFAULT false NOT NULL,
    "isPwdFriendly" boolean DEFAULT false NOT NULL,
    "noticePeriodPreference" public."NoticePeriodPreference"[] DEFAULT ARRAY[]::public."NoticePeriodPreference"[],
    "passportRequired" boolean DEFAULT false NOT NULL,
    "pgRequired" public."EducationLevel",
    "postingVisibility" public."PostingVisibility" DEFAULT 'PUBLIC'::public."PostingVisibility" NOT NULL,
    "referenceCode" text,
    "salaryNegotiable" boolean DEFAULT false NOT NULL,
    "scheduledPublishAt" timestamp(3) without time zone,
    "specificDegrees" public."SpecificDegree"[] DEFAULT ARRAY[]::public."SpecificDegree"[],
    "ugRequired" public."EducationLevel",
    "visaSponsorshipAvailable" boolean DEFAULT false NOT NULL,
    "walkInContactPerson" text,
    "walkInContactPhone" text,
    "walkInEndDate" timestamp(3) without time zone,
    "walkInInstructions" text,
    "walkInStartDate" timestamp(3) without time zone,
    "walkInTime" text,
    "walkInVenue" text
);


--
-- Name: JobTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JobTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "templateData" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: KnownDevice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."KnownDevice" (
    id text NOT NULL,
    "userId" text NOT NULL,
    fingerprint text NOT NULL,
    name text,
    "ipAddress" text,
    location text,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LoginLocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoginLocation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "ipAddress" text NOT NULL,
    country text,
    city text,
    latitude double precision,
    longitude double precision,
    "isTrusted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MfaTrustedDevice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MfaTrustedDevice" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" DEFAULT 'INFO'::public."NotificationType" NOT NULL,
    category text,
    link text,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProfileView; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileView" (
    id text NOT NULL,
    "viewerId" text NOT NULL,
    "profileUserId" text NOT NULL,
    "viewType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PushSubscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PushSubscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isRevoked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "sessionId" text
);


--
-- Name: SavedCandidate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedCandidate" (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "candidateId" text NOT NULL,
    notes text,
    "savedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SavedJob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedJob" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SavedSearch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedSearch" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "searchType" text NOT NULL,
    filters jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ScreeningAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScreeningAnswer" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "questionId" text NOT NULL,
    answer text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ScreeningQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScreeningQuestion" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    question text NOT NULL,
    "questionType" public."ScreeningQuestionType" DEFAULT 'TEXT'::public."ScreeningQuestionType" NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isDealBreaker" boolean DEFAULT false NOT NULL,
    options jsonb,
    "idealAnswer" text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupportTicket" (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    category public."TicketCategory" DEFAULT 'GENERAL'::public."TicketCategory" NOT NULL,
    "userId" text,
    "guestName" text,
    "guestEmail" text,
    "assignedToId" text,
    satisfaction public."TicketSatisfaction",
    "satisfactionComment" text,
    "resolvedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "firstResponseAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SystemConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SystemConfig" (
    id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TicketMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TicketMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "senderId" text,
    "senderType" text NOT NULL,
    "senderName" text NOT NULL,
    body text NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subject text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    role public."Role" DEFAULT 'CANDIDATE'::public."Role" NOT NULL,
    "firstName" text,
    "lastName" text,
    avatar text,
    "googleId" text,
    "linkedinId" text,
    "mobileNumber" text,
    "isMobileVerified" boolean DEFAULT false NOT NULL,
    "mobileVerificationToken" text,
    "mobileVerificationExpires" timestamp(3) without time zone,
    "isWhatsappVerified" boolean DEFAULT false NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationToken" text,
    "emailVerificationExpires" timestamp(3) without time zone,
    "passwordResetToken" text,
    "passwordResetExpires" timestamp(3) without time zone,
    "mfaSecret" text,
    "mfaEnabled" boolean DEFAULT false NOT NULL,
    "mfaBackupCodes" text[] DEFAULT ARRAY[]::text[],
    "loginAttempts" integer DEFAULT 0 NOT NULL,
    "lockUntil" timestamp(3) without time zone,
    "lastLoginAt" timestamp(3) without time zone,
    "lastLoginIp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "lastActiveAt" timestamp(3) without time zone,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedBy" text,
    "whatsappVerificationExpires" timestamp(3) without time zone,
    "whatsappVerificationToken" text,
    "deletionRequestedAt" timestamp(3) without time zone,
    "emailOtpLastSentAt" timestamp(3) without time zone,
    "emailOtpResendCount" integer DEFAULT 0 NOT NULL,
    "mobileOtpLastSentAt" timestamp(3) without time zone,
    "mobileOtpResendCount" integer DEFAULT 0 NOT NULL,
    "whatsappOtpLastSentAt" timestamp(3) without time zone,
    "whatsappOtpResendCount" integer DEFAULT 0 NOT NULL,
    "pendingEmail" text,
    "pendingMobileNumber" text,
    "whatsappNumber" text,
    "mfaRecoveryExpires" timestamp(3) without time zone,
    "mfaRecoveryToken" text
);


--
-- Name: UserConsent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserConsent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    version text NOT NULL,
    "givenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "ipAddress" text
);


--
-- Name: VerificationRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."VerificationType" NOT NULL,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "documentUrl" text,
    data jsonb,
    "reviewedBy" text,
    "adminComments" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "escalatedAt" timestamp(3) without time zone,
    "escalatedBy" text,
    "escalationReason" text,
    priority text DEFAULT 'NORMAL'::text,
    "approvalChain" jsonb,
    "autoEscalated" boolean DEFAULT false NOT NULL,
    "currentApprovalLevel" integer DEFAULT 1,
    "slaDeadline" timestamp(3) without time zone
);


--
-- Name: WebAuthnCredential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WebAuthnCredential" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "credentialId" text NOT NULL,
    "publicKey" bytea NOT NULL,
    counter bigint DEFAULT 0 NOT NULL,
    transports text[],
    "deviceType" text,
    "backedUp" boolean DEFAULT false NOT NULL,
    "friendlyName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WebhookDelivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WebhookDelivery" (
    id text NOT NULL,
    "webhookId" text NOT NULL,
    event text NOT NULL,
    payload jsonb NOT NULL,
    "statusCode" integer,
    response text,
    success boolean DEFAULT false NOT NULL,
    attempt integer DEFAULT 1 NOT NULL,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WebhookEndpoint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WebhookEndpoint" (
    id text NOT NULL,
    "userId" text NOT NULL,
    url text NOT NULL,
    secret text NOT NULL,
    events text[],
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "failureCount" integer DEFAULT 0 NOT NULL,
    "lastTriggeredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, action, entity, "entityId", "performedBy", details, "ipAddress", "userAgent", "createdAt", checksum, "isArchived") FROM stdin;
51cf9da6-dea6-41ac-b7da-65abebc5894d	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24", "gender": "MALE", "skills": ["JavaScript"], "country": "India", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "isVeteran": false, "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "maritalStatus": "MARRIED", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Jaipur, Rajasthan", "experienceYears": 2, "preferredJobType": ["FULL_TIME"], "hasDrivingLicense": false, "willingToRelocate": false, "servingNoticePeriod": false, "totalExperienceMonths": 1}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-17 15:23:49.879	0a71b23e06c9e6d30c5369e45c06142f4ac7c62a47e723e19194615e632b5912	f
b75ede21-9334-4473-a3ea-4fa86663c8b4	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24", "gender": "MALE", "skills": ["JavaScript"], "country": "India", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "isVeteran": false, "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "maritalStatus": "MARRIED", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Jaipur, Rajasthan", "experienceYears": 2, "preferredJobType": ["FULL_TIME"], "hasDrivingLicense": false, "willingToRelocate": false, "servingNoticePeriod": false, "totalExperienceMonths": 1}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-17 15:23:56.715	88c9497aacb9a444dd06c5b4ecde7cae9e5a7c0f0fa05309d8dc62fc3c3a17c6	f
3aea4c42-2010-4bfa-a3b7-40bdcb1b1088	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24", "gender": "MALE", "skills": ["JavaScript"], "country": "India", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "isVeteran": false, "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "maritalStatus": "MARRIED", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Jaipur, Rajasthan", "experienceYears": 2, "preferredJobType": ["FULL_TIME"], "hasDrivingLicense": false, "willingToRelocate": false, "servingNoticePeriod": false, "totalExperienceMonths": 1}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-17 15:24:30.244	1a6b03677636209b1234c0edeb7bafd2332bc0cead8e6cc48bab89c9858a322c	f
ae7879e0-0250-4b8f-8b37-c73e529c9de9	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "gender": "MALE", "skills": ["JavaScript"], "country": "India", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "isVeteran": false, "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "maritalStatus": "MARRIED", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Jaipur, Rajasthan", "experienceYears": 2, "preferredJobType": ["FULL_TIME"], "hasDrivingLicense": false, "willingToRelocate": false, "servingNoticePeriod": false, "totalExperienceMonths": 1}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-17 15:31:03.839	83b0fc04100dde6aa5bac260300eb50e8167982433daed1ee3a5d3b0abe1b226	f
724d2d71-26b4-4063-93c7-46363a72c68c	PROFILE_UPDATE	CandidateProfile	\N	e9538603-ee16-4226-91b8-35c1fda139f0	{"url": "/api/v1/candidates/me", "body": {"bio": "2 years wxp", "phone": "1234567890", "gender": "MALE", "skills": ["Sales", "Communication"], "country": "India", "headline": "Sales manager ", "pronouns": "he/him", "education": [{"field": "Electronics & Communication", "grade": "", "degree": "BA", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "Bikaner"}], "isVeteran": false, "currSalary": 12000, "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "workStatus": "UNEMPLOYED", "currentRole": "Sales Executive", "noticePeriod": "THIRTY_DAYS", "currentCompany": "Petrol pump", "functionalArea": "Operations", "hasCareerBreak": false, "salaryCurrency": "INR", "currentIndustry": "Power & Energy", "currentLocation": "Suratgarh", "experienceYears": 2, "preferredJobType": ["FULL_TIME"], "currentDepartment": "Engineering - Mechanical", "hasDrivingLicense": false, "willingToRelocate": false, "servingNoticePeriod": false}, "method": "PUT"}	106.207.137.114, 172.69.152.194, 10.19.137.177	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2026-02-19 03:02:01.165	b5857398034ea20ad00aee9483d57d1a4c53f61a78281ffd7ecc46cf8a82ae69	f
c1f50385-80cb-414a-9869-64cfa3e0d17e	PROFILE_UPDATE	CandidateProfile	\N	79dccb85-2d52-4afd-a9f1-7ac971621d1a	{"url": "/api/v1/candidates/me", "body": {"bio": "developer", "skills": ["JavaScript", "React", "Next.js"], "country": "India", "headline": "mern developer", "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "institution": "IIT Delhi"}], "isVeteran": false, "ownVehicle": false, "workStatus": "UNEMPLOYED", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Suratgarh", "experienceYears": 0, "preferredJobType": ["FULL_TIME"], "hasDrivingLicense": false, "preferredWorkMode": ["REMOTE"], "willingToRelocate": false, "servingNoticePeriod": false}, "method": "PUT"}	103.212.145.71, 172.69.203.128, 10.21.39.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 11:59:22.218	19bab13ed035d4c9bde024e106adc1afdc6813823ce37d8b1a639e6a183aa8bd	f
3066931d-5f95-471d-85be-63abd1d385cf	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 09:53:19.392	a02444c3303d5a4ddf928ee05d664c3860a0370ab24862912a6bb56412493a18	f
089188e8-1307-4d84-8ef4-dc557996df01	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 09:53:26.568	5655d9d62ea7214c2d6b3442eaed64c13e257bcdf15cdacb1edeade5aa9cf4d2	f
45a6219f-d25a-4f1f-b206-aca8484ca76f	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 09:55:36.014	8238c80da44942e6667e1fe1062de08b1cd41aef9fe10bd7189b9168b453eeaa	f
e9cc9489-dcad-4bf2-9f07-505f6493754a	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.69.152.195, 10.17.110.147	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:17:29.286	1dab50e39fb9395ba398ee68789a95634f9c04df833d8348b1e6d3706f1be17b	f
f7cd119d-f5dc-495e-b4a9-6430f75d41ca	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.70.142.80, 10.22.202.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:17:52.881	6590712e139d2a52db94ef35dec98b2150cbada2aa512dee2046a2a8f4fd82d3	f
1f3adc10-dbbc-43bc-8e49-4fdb24c65ca6	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.70.142.146, 10.18.110.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:19:49.471	05eb9ca39aa1fc20a9c21c6568925dd88d4eee52115d318d7585961e79066b64	f
1aafe766-9fbf-49e8-a403-425a59e916cf	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.70.142.181, 10.19.109.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:22:24.575	74dfdd360646a053076bbfcf3c02b4e2f953046f04a211b9d2189e47330736d7	f
cd3d7b78-9fa5-478b-8eb8-cfa2b14d50fb	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [{"language": "English", "proficiency": "FLUENT"}], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.70.142.224, 10.18.110.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:36:36.874	f3df03ac9f857036a7968e91358802b71fbcfa758e9e0775494701dacdbe9323	f
9b54ac47-7460-4671-bd51-fc0f4df0fce2	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "preferredLocations": [], "languageProficiency": [{"language": "English", "proficiency": "FLUENT"}], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	106.219.204.186, 172.69.152.194, 10.22.202.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 02:36:42.546	299dbd614128aa4806b69b18ac9c78062a005d36eac8c1c1566e18010a49f003	f
2d6e64c3-d5f9-41ce-a0df-56685a5dcf49	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "visaStatus": "", "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceLevel": "MID", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "workPermitStatus": "", "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "drivingLicenseType": "NONE", "preferredLocations": [], "languageProficiency": [{"language": "English", "proficiency": "FLUENT"}], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	103.212.145.105, 104.23.216.213, 10.19.109.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 08:35:54.571	95d57bdf4018085f2d8a0a36a6a02de08de888d09d43d8444f23de0f0745adbd	f
78e9f3e7-d424-4315-8c69-ea10a4ab9b49	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript", "React"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "visaStatus": "", "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceLevel": "MID", "experienceYears": 2, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "workPermitStatus": "", "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "drivingLicenseType": "NONE", "preferredLocations": [], "languageProficiency": [{"language": "English", "proficiency": "FLUENT"}], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	103.212.145.105, 172.71.124.183, 10.19.109.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 08:48:51.467	579ab1f52fd59357d9cbaa2b82feb41d8bb36cbcca22c3dbc9c54b72f389553a	f
1b56a757-1aa5-4c73-9e50-4c9ae58eccfe	JOB_CREATE	JobPost	\N	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	{"url": "/api/v1/jobs", "body": {"type": "FULL_TIME", "title": "Full Stack Developer", "currency": "INR", "isRemote": true, "location": "CHANDIGARH", "workMode": "REMOTE", "pgRequired": "DIPLOMA", "ugRequired": "TWELFTH", "applyMethod": "IN_PLATFORM", "description": "Full Stack Developer", "diversityTags": [], "experienceMin": 0, "skillsRequired": ["React"], "specificDegrees": ["BTECH_BE"], "passportRequired": true, "salaryNegotiable": true, "postingVisibility": "INTERNAL", "backgroundCheckRequired": false}, "method": "POST"}	103.212.145.105, 172.69.118.125, 10.22.202.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 12:29:39.051	c2f2f2a5841daded425e9036c21890733a8931fec2e6b0318ca1efc92330d9dd	f
c09f527a-42a0-457c-bc62-84e4cdca62ee	PROFILE_UPDATE	CandidateProfile	\N	88a66c49-ce6a-4e81-8e25-520a8d22f304	{"url": "/api/v1/candidates/me", "body": {"bio": "Test Profile", "dob": "2002-03-24T00:00:00.000Z", "city": "", "phone": "", "state": "", "awards": [], "gender": "MALE", "skills": ["JavaScript", "React"], "country": "India", "courses": [], "hobbies": [], "patents": [], "pincode": "", "category": "OBC", "headline": "Full Stack Developer for 2 Years", "hometown": "Jaipur", "itSkills": [], "projects": [], "pronouns": "he/him", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}], "interests": [], "isVeteran": false, "currSalary": 50000, "experience": [], "openToWork": "ACTIVELY_LOOKING", "ownVehicle": false, "references": [], "testScores": [], "visaStatus": "", "workStatus": "EMPLOYED", "currentRole": "Full Stack Developer", "nationality": "Indian", "addressLine1": "", "addressLine2": "", "noticePeriod": "THIRTY_DAYS", "portfolioUrl": "", "publications": [], "githubProfile": "", "maritalStatus": "MARRIED", "mediumProfile": "", "alternateEmail": "", "alternatePhone": "", "behanceProfile": "", "certifications": [], "currentCompany": "HCL Technologies", "disabilityType": "NONE", "functionalArea": "Engineering - Software", "hasCareerBreak": false, "passportNumber": "", "salaryCurrency": "INR", "twitterProfile": "", "videoResumeUrl": "", "youtubeChannel": "", "currentIndustry": "Information Technology", "currentLocation": "Jaipur, Rajasthan", "dribbbleProfile": "", "experienceLevel": "MID", "experienceYears": 3, "linkedinProfile": "", "personalBlogUrl": "", "blockedCompanies": [], "preferredJobType": ["FULL_TIME"], "workPermitStatus": "", "careerBreakReason": "", "currentDepartment": "Engineering - Mechanical", "expectedSalaryMax": 300000, "expectedSalaryMin": 100000, "hasDrivingLicense": false, "preferredWorkMode": [], "willingToRelocate": false, "drivingLicenseType": "NONE", "preferredLocations": [], "languageProficiency": [{"language": "English", "proficiency": "FLUENT"}], "preferredIndustries": [], "servingNoticePeriod": true, "volunteerExperience": [], "stackOverflowProfile": "", "skillsWithProficiency": [], "totalExperienceMonths": 1, "isPhysicallyChallenged": false, "preferredRoleCategories": [], "professionalMemberships": []}, "method": "PUT"}	103.212.145.41, 162.158.163.216, 10.18.110.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-27 06:23:46.751	f9405284ec3970a596350272487a460f59bbf54d6db4391bca94bce3f6770f8e	f
174bfa09-0564-47b8-89b6-442580aef496	PROFILE_UPDATE	CandidateProfile	\N	445ccba1-2875-4eb4-b732-19f0005caede	{"url": "/api/v1/candidates/me", "body": {"bio": "Full Stack Developer", "skills": ["React", "Python", "PHP"], "country": "India", "headline": "Full Stack Developer", "education": [{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "institution": "IIT Bombay"}], "isVeteran": false, "openToWork": "OPEN_TO_OFFERS", "ownVehicle": false, "workStatus": "EMPLOYED", "highestDegree": "BTECH_BE", "hasCareerBreak": false, "salaryCurrency": "INR", "currentLocation": "Chandigarh, Punjab", "experienceYears": 0, "preferredJobType": ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"], "hasDrivingLicense": false, "willingToRelocate": false, "preferredLocations": ["Mohali, Punjab"], "preferredIndustries": ["Architecture & Interior Design"], "servingNoticePeriod": false, "highestEducationLevel": "MASTERS", "isPhysicallyChallenged": false}, "method": "PUT"}	103.212.145.41, 104.23.216.213, 10.18.44.23	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-27 07:02:30.272	f0a60ef60d3857643c1696f5f2f766298feba70c58c8ee2055ac46033f7de5a6	f
9d28bdfb-722c-4a5c-abb3-0e80ba0ea1ef	PROFILE_UPDATE	CompanyProfile	\N	7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	{"url": "/api/v1/employers/me", "body": {"country": "India", "industry": "Information Technology", "companyName": "Testing", "companyType": "PRIVATE", "description": "IT Company", "socialLinks": {}, "contactEmail": "send@technotaau.com"}, "method": "PUT"}	103.212.145.41, 104.23.216.213, 10.21.245.65	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-27 07:29:16.427	aaabc9c76b0cdfcc003fa9f5ffe00a35d61ea4c140d4fb0f0b17002e0673f5b0	f
a05ffb4e-d51f-4c1f-b9a8-f7dedc0d5fe6	MFA_SETUP_INITIATED	User	6381ec6b-663c-46b0-b786-6101da4d6c77	6381ec6b-663c-46b0-b786-6101da4d6c77	{}	\N	\N	2026-02-27 07:38:14.125	0503c971bcadd6a832335c914fad09aff4e191abba26e5be91ba9aecf0a57a38	f
62128b31-1843-4716-be50-771234572062	MFA_ENABLED	User	6381ec6b-663c-46b0-b786-6101da4d6c77	6381ec6b-663c-46b0-b786-6101da4d6c77	{}	\N	\N	2026-02-27 07:45:40.047	b52c8c33292a9b5bb154296d9ba2f5593eed5790a3bbbec62e7df46da6b7a870	f
5f141d94-949d-4266-96d3-c4b74a9739dc	MODERATE_JOB	Job	0c6bb563-ab18-4c80-8659-f6a20301fa1a	6381ec6b-663c-46b0-b786-6101da4d6c77	{"url": "/api/v1/admin/jobs/0c6bb563-ab18-4c80-8659-f6a20301fa1a/status", "body": {"reason": "not applicable", "status": "CLOSED"}, "method": "PATCH"}	103.212.145.41, 104.23.216.214, 10.22.202.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-27 10:46:39.962	abd0dea47fb9d764d33e362a867ed71447548165f25536af04308cb52abd4f7e	f
d3122a4a-9e23-4659-81c7-fd3741394791	PROFILE_UPDATE	CompanyProfile	\N	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	{"url": "/api/v1/employers/me", "body": {"industry": "IT Services & Consulting", "companyName": "TechCorp"}, "method": "PUT"}	103.212.145.121, 104.23.216.213, 10.20.98.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-28 09:52:45.55	cd21fa2353566735fa254b70e56b47a45a7f1c6d6f833b841aa32957dfbbbcce	f
1cd3cd06-af6c-4d92-9d76-bca39250b04e	APPLICATION_SHORTLIST	JobApplication	\N	dd85f170-ad09-4a44-8785-54e0acc77f73	{"url": "/api/v1/employers/candidates/eecb4ef5-bb29-4583-85f5-673aef34c10a/shortlist", "body": {"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7"}, "method": "POST"}	103.212.145.121, 104.23.216.214, 10.21.217.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-28 10:01:49.955	efe403369e9e7e395e26d198d6fc48219a3935dd77fc14ebe54dfdc507adfc13	f
a01d13fa-fd43-4b8e-96ed-44fc537e6bb2	APPLICATION_SELECT	JobApplication	\N	dd85f170-ad09-4a44-8785-54e0acc77f73	{"url": "/api/v1/employers/candidates/eecb4ef5-bb29-4583-85f5-673aef34c10a/select", "body": {"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7"}, "method": "POST"}	103.212.145.121, 172.69.165.35, 10.20.98.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-28 10:02:59.354	7bbe590e9d7d196572f6c31b43a007cab465015b88a06d82e67620d2a8ff62d0	f
\.


--
-- Data for Name: CandidateList; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CandidateList" (id, "employerId", name, description, color, icon, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CandidateListMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CandidateListMember" (id, "listId", "candidateId", "addedAt", notes, "addedByUserId") FROM stdin;
\.


--
-- Data for Name: CandidateProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CandidateProfile" (id, "userId", dob, bio, resume, "resumeOriginalName", "profileImage", "currentLocation", "preferredLocations", phone, "experienceYears", "currentCompany", "currentRole", "currSalary", "expectedSalaryMin", "expectedSalaryMax", skills, languages, education, experience, "isPhysicallyChallenged", "githubProfile", "linkedinProfile", "portfolioUrl", "createdAt", "updatedAt", "addressLine1", "addressLine2", awards, "careerBreakReason", certifications, city, country, "currentDepartment", "currentIndustry", "dateOfAvailability", "disabilityPercentage", "disabilityType", "functionalArea", "hasCareerBreak", headline, hometown, "languageProficiency", latitude, longitude, "maritalStatus", nationality, "personalBlogUrl", pincode, "preferredIndustries", "preferredJobType", "preferredRoleCategories", "preferredShift", "preferredWorkMode", "profileCompleteness", projects, "salaryCurrency", "servingNoticePeriod", "skillsWithProficiency", "stackOverflowProfile", state, "totalExperienceMonths", "travelWillingnessPercent", "twitterProfile", "visaStatus", "willingToRelocate", "workPermitStatus", "workStatus", gender, "noticePeriod", "additionalResumes", "alternateEmail", "alternatePhone", "behanceProfile", "blockedCompanies", "careerBreakType", category, courses, "dribbbleProfile", "hasDrivingLicense", hobbies, interests, "isVeteran", "itSkills", "mediumProfile", "openToWork", "ownVehicle", "parsedResumeData", "passportExpiryDate", "passportNumber", patents, "professionalMemberships", pronouns, publications, "references", "testScores", "videoResumeUrl", "volunteerExperience", "youtubeChannel", "generatedResumeAt", "generatedResumeUrl", "notificationPreferences", "drivingLicenseType", "experienceLevel", "highestDegree", "highestEducationLevel", "resumeMimeType", "resumeSize", "resumeUploadedAt") FROM stdin;
eccffe3e-4c6d-4fb7-975f-7f9941c3f943	3b5f6375-de2a-4359-a75c-72bd9ec017e4	\N	\N	\N	\N	\N	Bangalore	\N	\N	6	Infosys	Senior Software Engineer	1800000.00	2400000.00	3000000.00	{React,Node.js,TypeScript,PostgreSQL,Docker,AWS}	{English,Hindi}	\N	\N	f	\N	\N	\N	2026-02-13 10:40:48.067	2026-02-13 10:40:48.067	\N	\N	\N	\N	\N	Bangalore	India	\N	Information Technology	\N	\N	NONE	\N	f	Senior Full Stack Developer | 6 yrs | React + Node.js	\N	\N	12.9716	77.5946	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{HYBRID,REMOTE}	85	\N	INR	f	\N	\N	Karnataka	\N	0	\N	\N	f	\N	EMPLOYED	MALE	THIRTY_DAYS	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
46c77eb7-bef8-4299-a48e-e34ea469ed71	a32e15b1-9d2b-4a41-9a75-df4de859530a	\N	\N	\N	\N	\N	Mumbai	\N	\N	4	TCS	Data Scientist	1500000.00	2000000.00	2500000.00	{Python,TensorFlow,Pandas,SQL,Tableau,MLflow}	{English,Hindi}	\N	\N	f	\N	\N	\N	2026-02-13 10:40:48.361	2026-02-13 10:40:48.361	\N	\N	\N	\N	\N	Mumbai	India	\N	Information Technology	\N	\N	NONE	\N	f	Data Scientist | Python + ML | 4 yrs exp	\N	\N	19.076	72.8777	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{HYBRID,REMOTE}	90	\N	INR	f	\N	\N	Maharashtra	\N	0	\N	\N	f	\N	EMPLOYED	FEMALE	SIXTY_DAYS	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
2c789c13-9f2c-48fa-ab22-cca9c6e1f7d0	b8359dda-0144-481c-b661-69b09d15d724	\N	\N	\N	\N	\N	Hyderabad	\N	\N	3	Wipro	Software Developer	1200000.00	1600000.00	2000000.00	{Java,"Spring Boot",Hibernate,MySQL,Kafka,Redis}	{English,Hindi}	\N	\N	f	\N	\N	\N	2026-02-13 10:40:48.641	2026-02-13 10:40:48.641	\N	\N	\N	\N	\N	Hyderabad	India	\N	Information Technology	\N	\N	NONE	\N	f	Backend Developer | Java + Spring Boot | 3 yrs	\N	\N	17.385	78.4867	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{HYBRID,REMOTE}	70	\N	INR	f	\N	\N	Telangana	\N	0	\N	\N	f	\N	ACTIVELY_LOOKING	MALE	THIRTY_DAYS	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
a9c6a315-ada9-4766-ab7d-f957b3e6f722	fd46ba43-d5a9-4fa5-a31b-37c73c18ce8c	\N	\N	\N	\N	\N	Pune	\N	\N	2	\N	\N	\N	800000.00	1200000.00	{Figma,Sketch,"Adobe XD",HTML,CSS,React}	{English,Hindi}	\N	\N	f	\N	\N	\N	2026-02-13 10:40:48.912	2026-02-13 10:40:48.912	\N	\N	\N	\N	\N	Pune	India	\N	Design	\N	\N	NONE	\N	f	UI/UX Designer | Figma + React | 2 yrs	\N	\N	18.5204	73.8567	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{HYBRID,REMOTE}	65	\N	INR	f	\N	\N	Maharashtra	\N	0	\N	\N	f	\N	ACTIVELY_LOOKING	FEMALE	IMMEDIATE	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
2fae47cd-c4f2-40af-ab89-58975184570b	01cb027d-9239-41e4-87ea-05735144f176	\N	\N	\N	\N	\N	Delhi	\N	\N	5	Amazon	DevOps Engineer	2500000.00	3200000.00	4000000.00	{AWS,Kubernetes,Docker,Terraform,Jenkins,Python}	{English,Hindi}	\N	\N	f	\N	\N	\N	2026-02-13 10:40:49.184	2026-02-13 10:40:49.184	\N	\N	\N	\N	\N	New Delhi	India	\N	Information Technology	\N	\N	NONE	\N	f	DevOps Engineer | AWS + Kubernetes | 5 yrs	\N	\N	28.6139	77.209	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{HYBRID,REMOTE}	92	\N	INR	f	\N	\N	Delhi	\N	0	\N	\N	f	\N	EMPLOYED	MALE	NINETY_DAYS	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
56ff4b50-2529-4749-aca2-d432463710a8	79dccb85-2d52-4afd-a9f1-7ac971621d1a	\N	developer	\N	\N	\N	Suratgarh	\N	\N	0	\N	\N	\N	\N	\N	{JavaScript,React,Next.js}	\N	[{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "institution": "IIT Delhi"}]	\N	f	\N	\N	\N	2026-02-19 11:59:22.252	2026-02-19 11:59:24.251	\N	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	NONE	\N	f	mern developer	\N	\N	29.3203309	73.9026728	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{REMOTE}	30	\N	INR	f	\N	\N	\N	\N	0	\N	\N	f	\N	UNEMPLOYED	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	\N	f	\N	\N	\N	\N	\N	he/him	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
7a55fa24-e73f-4b3e-bf47-178aafdc78a5	e9538603-ee16-4226-91b8-35c1fda139f0	\N	2 years wxp	\N	\N	\N	Suratgarh	\N	1234567890	2	Petrol pump	Sales Executive	12000.00	\N	\N	{Sales,Communication}	\N	[{"field": "Electronics & Communication", "grade": "", "degree": "BA", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "Bikaner"}]	\N	f	\N	\N	\N	2026-02-19 03:02:01.338	2026-02-19 03:02:04.239	\N	\N	\N	\N	\N	\N	India	Engineering - Mechanical	Power & Energy	\N	\N	NONE	Operations	f	Sales manager 	\N	\N	29.3203309	73.9026728	\N	Indian	\N	\N	{}	{FULL_TIME}	{}	\N	{}	48	\N	INR	f	\N	\N	\N	\N	0	\N	\N	f	\N	UNEMPLOYED	MALE	THIRTY_DAYS	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	ACTIVELY_LOOKING	f	\N	\N	\N	\N	\N	he/him	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	\N	\N	\N	\N	\N
ff924de4-a1aa-4de1-aa64-e873a08eae06	445ccba1-2875-4eb4-b732-19f0005caede	\N	Full Stack Developer	\N	\N	\N	Chandigarh, Punjab	{"Mohali, Punjab"}	\N	0	\N	\N	\N	\N	\N	{React,Python,PHP}	\N	[{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "institution": "IIT Bombay"}]	\N	f	\N	\N	\N	2026-02-27 07:02:30.328	2026-02-27 07:02:33.423	\N	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	NONE	\N	f	Full Stack Developer	\N	\N	30.6741923	76.7909851	\N	Indian	\N	\N	{"Architecture & Interior Design"}	{FULL_TIME,PART_TIME,CONTRACT,INTERNSHIP,FREELANCE}	{}	\N	{}	48	\N	INR	f	\N	\N	\N	\N	0	\N	\N	f	\N	EMPLOYED	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	f	{}	{}	f	\N	\N	OPEN_TO_OFFERS	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	NONE	\N	BTECH_BE	MASTERS	\N	\N	\N
eecb4ef5-bb29-4583-85f5-673aef34c10a	88a66c49-ce6a-4e81-8e25-520a8d22f304	2002-03-24 00:00:00	Test Profile	\N	\N	https://res.cloudinary.com/dvyccnlre/image/upload/v1772186862/talent_bridge/profiles/b2ixrezrbwwhf6ijmikx.jpg	Jaipur, Rajasthan	{}		3	HCL Technologies	Full Stack Developer	50000.00	100000.00	300000.00	{JavaScript,React}	\N	[{"field": "Computer Science", "grade": "", "degree": "B.Tech", "endDate": "", "startDate": "", "courseType": "FULL_TIME", "institution": "IIT Bombay", "specialization": "Ai"}]	[]	f				2026-02-17 15:31:03.85	2026-02-27 10:07:44.196			[]		[]		India	Engineering - Mechanical	Information Technology	\N	\N	NONE	Engineering - Software	f	Full Stack Developer for 2 Years	Jaipur	[{"language": "English", "proficiency": "FLUENT"}]	26.9154576	75.8189817	MARRIED	Indian			{}	{FULL_TIME}	{}	\N	{}	65	[]	INR	t	[]			1	0			f		EMPLOYED	MALE	THIRTY_DAYS	\N				{}	\N	OBC	[]		f	{}	{}	f	[]		ACTIVELY_LOOKING	f	\N	\N		[]	[]	he/him	[]	[]	[]		[]		\N	\N	\N	NONE	MID	\N	\N	\N	\N	\N
\.


--
-- Data for Name: CompanyProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CompanyProfile" (id, "userId", "companyName", logo, industry, "companySize", description, website, "foundedYear", headquarters, locations, "gstNumber", "isVerified", "createdAt", "updatedAt", "addressLine1", "addressLine2", "annualRevenueRange", "awardsRecognitions", benefits, "cinNumber", city, "companyCulture", "companyType", "contactEmail", "contactPhone", country, "coverImage", "diversityStatement", "employeeCount", latitude, longitude, "missionStatement", "panNumber", pincode, "socialLinks", state, "structuredPerks", tagline, "techStack", "visionStatement", "workplacePolicies", "blogUrl", "careersPageUrl", "contactPersonDesignation", "contactPersonName", "coreValues", "csrInitiatives", "employeeResourceGroups", "employeeTestimonials", "fundingStage", "interviewProcess", investors, "leadershipTeam", "officePhotos", "parentCompany", "productsServices", specialties, "stockTicker", "subIndustry", "totalFundingRaised", "whyWorkForUs", "notificationPreferences", "companyVideoUrl", "numberOfOffices") FROM stdin;
f31c4403-e0be-496f-8af8-fc117a5dbbde	af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	TechCorp Solutions	\N	Information Technology	1001-5000	TechCorp Solutions is a leading multinational technology company specializing in enterprise software, cloud computing, and AI solutions. Founded in 2005, we serve Fortune 500 clients globally.	https://techcorp.example.com	2005	Bangalore, Karnataka	{Bangalore,Mumbai,Hyderabad,Pune}	\N	t	2026-02-13 10:40:47.498	2026-02-13 10:40:47.498	\N	\N	\N	\N	{"Health Insurance","Stock Options","Remote Work","Learning Budget","Gym Membership"}	\N	Bangalore	\N	MNC	hr@techcorp.com	+91-9876543210	India	\N	\N	3200	12.9716	77.5946	\N	\N	\N	\N	Karnataka	\N	Building the future of enterprise software	{React,Node.js,Python,AWS,Kubernetes,PostgreSQL}	\N	\N	\N	\N	\N	\N	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N
5f70cbd6-cf5e-411e-84f1-c610fc6e956b	7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	Testing	\N	Information Technology	\N	IT Company	\N	\N	\N	\N	\N	f	2026-02-27 07:29:16.434	2026-02-27 07:29:17.517	\N	\N	\N	\N	{}	\N	\N	\N	PRIVATE	send@technotaau.com	\N	India	\N	\N	\N	22.3511148	78.6677428	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N
844b8c00-b675-4f1c-8da1-77aef38475b6	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	TechCorp	\N	IT Services & Consulting	\N	\N	\N	\N	\N	\N	\N	f	2026-02-28 09:52:45.556	2026-02-28 09:52:45.556	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N
61fef03d-caea-4608-8f02-3cad4cfd1a92	dd85f170-ad09-4a44-8785-54e0acc77f73	StartupX Labs	https://res.cloudinary.com/dvyccnlre/image/upload/v1772275129/talent_bridge/companies/buuiuyfo3oi6850gkpvc.jpg	Healthcare Technology	11-50	StartupX Labs is an AI-first startup revolutionizing healthcare diagnostics using computer vision and machine learning. Backed by top-tier VCs.	https://startupx.example.com	2022	Mumbai, Maharashtra	{Mumbai}	\N	f	2026-02-13 10:40:47.792	2026-02-28 10:38:50.491	\N	\N	\N	\N	{ESOPs,"Flexible Hours","Health Insurance","Team Outings"}	\N	Mumbai	\N	STARTUP	hiring@startupx.com	+91-8765432109	India	\N	\N	35	19.076	72.8777	\N	\N	\N	\N	Maharashtra	\N	AI-first startup disrupting healthcare	{Python,TensorFlow,FastAPI,React,GCP,MongoDB}	\N	\N	\N	\N	\N	\N	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: ContactMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ContactMessage" (id, name, email, subject, message, "isRead", "repliedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeviceToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeviceToken" (id, "userId", token, platform, "deviceName", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DismissedRecommendation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DismissedRecommendation" (id, "userId", "jobId", "createdAt") FROM stdin;
\.


--
-- Data for Name: FormDraft; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FormDraft" (id, "userId", "formType", data, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JobAlert; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobAlert" (id, "userId", name, filters, frequency, "isActive", "lastNotifiedAt", "newMatchCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JobApplication; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobApplication" (id, "jobId", "candidateId", status, "coverLetter", "resumeSnapshot", "appliedAt", "updatedAt", "candidateNotes", "hiredAt", "interviewDate", "interviewFeedback", "interviewNotes", "matchScore", "offerDetails", "offeredAt", "rejectionReason", source, "viewedAt", "selectedAt") FROM stdin;
aa435c16-1c52-401e-816a-ff52c94466cc	be7b7aed-539e-4d25-8948-54522539d34b	eccffe3e-4c6d-4fb7-975f-7f9941c3f943	SHORTLISTED	\N	\N	2026-02-13 10:40:49.645	2026-02-13 10:40:49.645	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
2fb53060-9416-4836-8420-7d28c579326c	be7b7aed-539e-4d25-8948-54522539d34b	2c789c13-9f2c-48fa-ab22-cca9c6e1f7d0	APPLIED	\N	\N	2026-02-13 10:40:49.941	2026-02-13 10:40:49.941	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
f094b1f1-bf60-463c-b091-34e432b7779b	513001cc-941d-450f-a722-0e40c5b9efd4	2fae47cd-c4f2-40af-ab89-58975184570b	INTERVIEW_SCHEDULED	\N	\N	2026-02-13 10:40:50.208	2026-02-13 10:40:50.208	\N	\N	2026-02-20 10:40:49.643	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
100ef9e1-e9f3-477d-9ea6-3ad8cc203969	0c6bb563-ab18-4c80-8659-f6a20301fa1a	46c77eb7-bef8-4299-a48e-e34ea469ed71	OFFERED	\N	\N	2026-02-13 10:40:50.495	2026-02-13 10:40:50.495	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
b35da753-25f6-4650-9ca6-49ca1c4c8e6f	4a6dcee8-99b1-420c-bd16-5c37fbe587c7	a9c6a315-ada9-4766-ab7d-f957b3e6f722	APPLIED	\N	\N	2026-02-13 10:40:50.777	2026-02-13 10:40:50.777	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
3f0c4d59-1be4-4738-9e39-1b99df0c03f6	4a6dcee8-99b1-420c-bd16-5c37fbe587c7	eccffe3e-4c6d-4fb7-975f-7f9941c3f943	VIEWED	\N	\N	2026-02-13 10:40:51.037	2026-02-13 10:40:51.037	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEARCH	\N	\N
301c4f5f-d0d8-42e1-a193-e75f62af07d5	513001cc-941d-450f-a722-0e40c5b9efd4	eecb4ef5-bb29-4583-85f5-673aef34c10a	APPLIED	\N	\N	2026-02-27 11:11:10.344	2026-02-27 11:11:10.344	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
404f7b1e-429f-404f-9dac-9865c48c1125	be7b7aed-539e-4d25-8948-54522539d34b	eecb4ef5-bb29-4583-85f5-673aef34c10a	WITHDRAWN	\N	\N	2026-02-25 10:04:47.068	2026-02-28 09:44:52.193	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6c587109-f9fc-4c1d-8931-f4be7d1cf5d6	4a6dcee8-99b1-420c-bd16-5c37fbe587c7	eecb4ef5-bb29-4583-85f5-673aef34c10a	SELECTED	\N	\N	2026-02-25 10:02:04.821	2026-02-28 10:02:59.647	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-28 10:02:59.646
\.


--
-- Data for Name: JobCandidateMatch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobCandidateMatch" (id, "jobId", "candidateId", "matchScore", "notificationsSent", "emailSent", "smsSent", "pushSent", "whatsappSent", "createdAt", "notifiedAt") FROM stdin;
\.


--
-- Data for Name: JobPost; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobPost" (id, "companyId", title, description, requirements, benefits, type, status, industry, department, "roleCategory", location, "isRemote", "salaryMin", "salaryMax", currency, "experienceMin", "experienceMax", "skillsRequired", views, "expiresAt", "createdAt", "updatedAt", "applicationDeadline", "certificationsRequired", "closedAt", "closedReason", "contactEmail", "contactPerson", "educationRequired", "experienceLevel", "interviewProcess", "isFeatured", "isPremium", "isWalkIn", "jobPerks", "keyResponsibilities", "languagesRequired", latitude, longitude, "niceToHaveSkills", "numberOfOpenings", "preferredEducationField", "relocationAssistance", "salaryDisclosed", "salaryType", "shiftType", tags, "travelRequirementPercent", "urgencyLevel", "walkInDetails", "workMode", "accommodationProvided", "additionalLocations", "ageMax", "ageMin", "applyMethod", "backgroundCheckRequired", "bondDetails", "degreeSpecializations", "diversityTags", "drivingLicenseRequired", "externalApplyUrl", "functionalArea", "genderPreference", "isConfidential", "isPwdFriendly", "noticePeriodPreference", "passportRequired", "pgRequired", "postingVisibility", "referenceCode", "salaryNegotiable", "scheduledPublishAt", "specificDegrees", "ugRequired", "visaSponsorshipAvailable", "walkInContactPerson", "walkInContactPhone", "walkInEndDate", "walkInInstructions", "walkInStartDate", "walkInTime", "walkInVenue") FROM stdin;
68065fc8-309c-41ec-b26d-4897d9a50b62	f31c4403-e0be-496f-8af8-fc117a5dbbde	Java Backend Developer	Develop microservices using Java and Spring Boot for our enterprise platform.	\N	\N	FULL_TIME	CLOSED	Information Technology	Engineering	\N	Pune, Maharashtra	f	1500000.00	2200000.00	INR	3	5	{Java,"Spring Boot",Hibernate,MySQL}	0	\N	2026-02-13 10:40:49.468	2026-02-13 10:40:49.468	\N	{}	2026-02-13 10:40:49.461	FILLED	\N	\N	\N	MID	\N	f	f	f	{}	\N	\N	\N	\N	{}	1	\N	f	t	ANNUAL	\N	{java,backend,spring}	0	NORMAL	\N	ON_SITE	f	{}	\N	\N	IN_PLATFORM	f	\N	{}	{}	\N	\N	\N	ANY	f	f	{}	f	\N	PUBLIC	\N	f	\N	{}	\N	f	\N	\N	\N	\N	\N	\N	\N
513001cc-941d-450f-a722-0e40c5b9efd4	f31c4403-e0be-496f-8af8-fc117a5dbbde	DevOps Engineer	Join our infrastructure team to build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure system reliability.	\N	\N	FULL_TIME	OPEN	Information Technology	Infrastructure	\N	Hyderabad, Telangana	f	1800000.00	2800000.00	INR	3	6	{AWS,Kubernetes,Docker,Terraform}	1	\N	2026-02-13 10:40:49.465	2026-02-27 09:31:47.762	2026-03-30 10:40:49.461	{}	\N	\N	\N	\N	BACHELORS	MID	\N	f	f	f	{}	\N	\N	\N	\N	{Python,Ansible,Prometheus}	2	\N	f	t	ANNUAL	\N	{devops,aws,kubernetes}	0	NORMAL	\N	ON_SITE	f	{}	\N	\N	IN_PLATFORM	f	\N	{}	{}	\N	\N	\N	ANY	f	f	{}	f	\N	PUBLIC	\N	f	\N	{}	\N	f	\N	\N	\N	\N	\N	\N	\N
be7b7aed-539e-4d25-8948-54522539d34b	f31c4403-e0be-496f-8af8-fc117a5dbbde	Senior Full Stack Developer	We are looking for an experienced Full Stack Developer to join our engineering team. You will work on building scalable web applications using React and Node.js.	B.Tech/B.E. in Computer Science or equivalent\n5+ years of experience with React and Node.js\nStrong understanding of system design	\N	FULL_TIME	OPEN	Information Technology	Engineering	\N	Bangalore, Karnataka	f	2500000.00	3500000.00	INR	5	8	{React,Node.js,TypeScript,PostgreSQL}	2	\N	2026-02-13 10:40:49.464	2026-02-27 07:09:02.517	2026-03-15 10:40:49.461	{}	\N	\N	\N	\N	BACHELORS	SENIOR	\N	f	f	f	{"Remote Fridays","Learning Budget","Stock Options"}	Design and develop scalable web applications\nMentor junior developers\nParticipate in code reviews\nCollaborate with product and design teams	\N	12.9716	77.5946	{AWS,Docker,GraphQL}	3	\N	f	t	ANNUAL	FLEXIBLE	{fullstack,react,nodejs,typescript}	0	URGENT	\N	HYBRID	f	{}	\N	\N	IN_PLATFORM	f	\N	{}	{}	\N	\N	\N	ANY	f	f	{}	f	\N	PUBLIC	\N	f	\N	{}	\N	f	\N	\N	\N	\N	\N	\N	\N
0c6bb563-ab18-4c80-8659-f6a20301fa1a	61fef03d-caea-4608-8f02-3cad4cfd1a92	ML Engineer - Healthcare AI	Build ML models for medical image analysis and diagnostic prediction. Work closely with doctors and researchers.	\N	\N	FULL_TIME	CLOSED	Healthcare Technology	AI/ML	\N	Mumbai, Maharashtra (Remote)	t	2000000.00	3500000.00	INR	2	5	{Python,TensorFlow,PyTorch,"Computer Vision"}	1	\N	2026-02-13 10:40:49.466	2026-02-27 10:46:39.972	2026-02-28 10:40:49.461	{}	\N	\N	\N	\N	\N	MID	\N	f	f	f	{}	\N	\N	19.076	72.8777	{DICOM,"Medical Imaging",MLOps}	1	\N	f	t	ANNUAL	\N	{ml,ai,healthcare,python}	0	IMMEDIATE	\N	REMOTE	f	{}	\N	\N	IN_PLATFORM	f	\N	{}	{}	\N	\N	\N	ANY	f	f	{}	f	\N	PUBLIC	\N	f	\N	{}	\N	f	\N	\N	\N	\N	\N	\N	\N
4a6dcee8-99b1-420c-bd16-5c37fbe587c7	61fef03d-caea-4608-8f02-3cad4cfd1a92	Frontend Developer (React)	Build beautiful, accessible, and performant user interfaces for our healthcare platform.	\N	\N	FULL_TIME	OPEN	Healthcare Technology	Engineering	\N	Mumbai, Maharashtra	f	800000.00	1500000.00	INR	1	3	{React,TypeScript,"Tailwind CSS",HTML}	6	\N	2026-02-13 10:40:49.467	2026-02-28 10:30:07.723	2026-04-14 10:40:49.461	{}	\N	\N	\N	\N	\N	ENTRY	\N	f	f	f	{}	\N	\N	\N	\N	{}	2	\N	f	t	ANNUAL	\N	{frontend,react,typescript}	0	NORMAL	\N	HYBRID	f	{}	\N	\N	IN_PLATFORM	f	\N	{}	{}	\N	\N	\N	ANY	f	f	{}	f	\N	PUBLIC	\N	f	\N	{}	\N	f	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: JobTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobTemplate" (id, "companyId", name, description, "templateData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KnownDevice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnownDevice" (id, "userId", fingerprint, name, "ipAddress", location, "lastUsedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LoginLocation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LoginLocation" (id, "userId", "ipAddress", country, city, latitude, longitude, "isTrusted", "createdAt") FROM stdin;
cmlqgg4lk00001cz01obuj48d	47e36905-1f10-4e8a-9d5b-d463c475a69f	::1	Local	Local	\N	\N	f	2026-02-17 10:23:06.056
cmlqia12800005sz0ko9ea6hj	47e36905-1f10-4e8a-9d5b-d463c475a69f	::1	Local	Local	\N	\N	f	2026-02-17 11:14:20.768
cmlqmjstb0000e0z0uvsrlksr	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 13:13:55.103
cmlqmwsgs0001e0z0d406wloo	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 13:24:01.18
cmlqmxtp00002e0z003dhoglq	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 13:24:49.428
cmlqqqzhs0000fkz0ufl8ul70	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 15:11:28.816
cmlqr6qt8000018z0mlhqi32u	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 15:23:44.06
cmlqs5wn1000118z00qyigy49	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 15:51:04.573
cmlqv020t0000ekz0teae7baq	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-17 17:10:30.461
cmlrm88t50000mgz09e2hzn2b	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-18 05:52:42.137
cmls6ag340000fkz0odpdtsf6	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-18 15:14:17.2
cmlsvmppo00001h7rc4ocncr6	e9538603-ee16-4226-91b8-35c1fda139f0	10.16.52.138	Local	Local	\N	\N	f	2026-02-19 03:03:39.948
cmlt01h8n00001h7ncpaomxpo	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.23.120.65	Local	Local	\N	\N	f	2026-02-19 05:07:07.27
cmltdnhnb00001gc7948a9i78	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.21.39.27	Local	Local	\N	\N	f	2026-02-19 11:28:09.239
cmlte3ltw000020fr78fbktla	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.21.39.27	Local	Local	\N	\N	f	2026-02-19 11:40:41.156
cmltf8zzw000120frwj2wgxgv	6381ec6b-663c-46b0-b786-6101da4d6c77	10.16.52.138	Local	Local	\N	\N	f	2026-02-19 12:12:52.412
cmltf9uzy000220frrzf7ssa8	6381ec6b-663c-46b0-b786-6101da4d6c77	10.21.39.27	Local	Local	\N	\N	f	2026-02-19 12:13:32.59
cmm1uryq10000g4z04at1rffk	88a66c49-ce6a-4e81-8e25-520a8d22f304	::1	Local	Local	\N	\N	f	2026-02-25 09:49:40.872
cmm2sn7vo0000208g7ocifnss	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.17.110.147	Local	Local	\N	\N	f	2026-02-26 01:37:46.404
cmm2sp2kw0001208g307hk31i	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.19.109.67	Local	Local	\N	\N	f	2026-02-26 01:39:12.848
cmm3btm4d00001z9zeu82knoq	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.18.31.4	Local	Local	\N	\N	f	2026-02-26 10:34:37.501
cmm3fqcg6000020dx0ec7clok	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	10.18.31.4	Local	Local	\N	\N	f	2026-02-26 12:24:03.461
cmm4gq5so00001zbcz6t2uoib	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	10.17.110.147	Local	Local	\N	\N	f	2026-02-27 05:39:40.632
cmm4i6us300011zbctgdlerds	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.17.110.147	Local	Local	\N	\N	f	2026-02-27 06:20:39.122
cmm4ke2sd00021zbcn43q7r81	445ccba1-2875-4eb4-b732-19f0005caede	10.21.245.65	Local	Local	\N	\N	f	2026-02-27 07:22:15.325
cmm4ky4uy00031zbcveyrgehn	6381ec6b-663c-46b0-b786-6101da4d6c77	10.17.110.147	Local	Local	\N	\N	f	2026-02-27 07:37:51.13
cmm4nb6pw00041zbchkhsezdo	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.21.245.65	Local	Local	\N	\N	f	2026-02-27 08:43:59.3
cmm4rjy3z00001zb9lfzzhc4i	6381ec6b-663c-46b0-b786-6101da4d6c77	10.22.202.27	Local	Local	\N	\N	f	2026-02-27 10:42:46.511
cmm4rrttt00011zb970nifw4z	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.17.110.147	Local	Local	\N	\N	f	2026-02-27 10:48:54.209
cmm4ss2xf00021zb9mar64byr	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	10.22.202.27	Local	Local	\N	\N	f	2026-02-27 11:17:05.619
cmm60j85x000020e1mwh10xhx	6381ec6b-663c-46b0-b786-6101da4d6c77	10.20.32.194	Local	Local	\N	\N	f	2026-02-28 07:41:55.605
cmm64q2pb00001hci02m272ho	6381ec6b-663c-46b0-b786-6101da4d6c77	10.21.217.29	Local	Local	\N	\N	f	2026-02-28 09:39:13.583
cmm64s0ms00011hcinhlbwq62	88a66c49-ce6a-4e81-8e25-520a8d22f304	10.21.217.29	Local	Local	\N	\N	f	2026-02-28 09:40:44.212
cmm6550d600021hci3sum93kq	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	10.20.98.3	Local	Local	\N	\N	f	2026-02-28 09:50:50.394
cmm65gh0g00031hciu6ka8aqc	dd85f170-ad09-4a44-8785-54e0acc77f73	10.20.98.3	Local	Local	\N	\N	f	2026-02-28 09:59:45.184
cmm69dm9f00041hcio6czx1rj	6381ec6b-663c-46b0-b786-6101da4d6c77	10.20.32.194	Local	Local	\N	\N	f	2026-02-28 11:49:30.483
\.


--
-- Data for Name: MfaTrustedDevice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MfaTrustedDevice" (id, "userId", "tokenHash", "userAgent", "ipAddress", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "userId", title, message, type, category, link, "isRead", "readAt", metadata, "createdAt", "updatedAt") FROM stdin;
cde1c8d3-8445-4e97-8dc1-fcfa98aad4b5	3b5f6375-de2a-4359-a75c-72bd9ec017e4	Application Shortlisted	Your application for Senior Full Stack Developer at TechCorp has been shortlisted!	SUCCESS	application_update	/candidate/applications	f	\N	\N	2026-02-13 10:40:51.304	2026-02-19 12:09:53.85
fd34a258-f647-44e2-98d4-4eb07afd9679	a32e15b1-9d2b-4a41-9a75-df4de859530a	Job Offer Received	Congratulations! StartupX Labs has extended an offer for ML Engineer.	SUCCESS	application_update	/candidate/applications	f	\N	\N	2026-02-13 10:40:51.372	2026-02-19 12:09:53.85
59a20bc0-ecef-42c4-be52-9cbeadd644b0	01cb027d-9239-41e4-87ea-05735144f176	Interview Scheduled	Your interview for DevOps Engineer at TechCorp is scheduled.	INFO	application_update	/candidate/applications	f	\N	\N	2026-02-13 10:40:51.429	2026-02-19 12:09:53.85
9a9ced26-ed25-4e8c-992d-53ecd2cec5f9	af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	New Applications	You have 3 new applications for Senior Full Stack Developer.	INFO	job_update	/employer/jobs	f	\N	\N	2026-02-13 10:40:51.484	2026-02-19 12:09:53.85
469df0e9-9d33-4d3d-979f-8eeac623e02d	dd85f170-ad09-4a44-8785-54e0acc77f73	New Application	Test User applied for Frontend Developer (React)	INFO	application_update	/employer/jobs/4a6dcee8-99b1-420c-bd16-5c37fbe587c7/applications	f	\N	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "applicationId": "6c587109-f9fc-4c1d-8931-f4be7d1cf5d6"}	2026-02-25 10:02:06.153	2026-02-25 10:02:06.153
a61a64a1-a7b3-4236-96c9-ecf0dd1e3f63	af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	New Application	Test User applied for Senior Full Stack Developer	INFO	application_update	/employer/jobs/be7b7aed-539e-4d25-8948-54522539d34b/applications	f	\N	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "applicationId": "404f7b1e-429f-404f-9dac-9865c48c1125"}	2026-02-25 10:04:47.406	2026-02-25 10:04:47.406
34a02913-6e32-4cf5-95c8-5d5c511f99af	88a66c49-ce6a-4e81-8e25-520a8d22f304	Application Submitted	Your application for Frontend Developer (React) at StartupX Labs has been submitted successfully.	SUCCESS	application_update	/candidate/applications	t	2026-02-26 08:13:48.726	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7"}	2026-02-25 10:02:06.153	2026-02-26 08:13:48.732
99abef69-cedc-4afe-965f-d7d6a2af2aaa	88a66c49-ce6a-4e81-8e25-520a8d22f304	Application Submitted	Your application for Senior Full Stack Developer at TechCorp Solutions has been submitted successfully.	SUCCESS	application_update	/candidate/applications	t	2026-02-26 08:13:48.726	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b"}	2026-02-25 10:04:47.407	2026-02-26 08:13:48.732
61ea6c9f-35a0-4184-8908-e4bfefb5f444	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Welcome to Talent Bridge!	Complete your profile to get started and find your perfect match.	INFO	onboarding	\N	f	\N	\N	2026-02-26 10:12:05.2	2026-02-26 10:12:05.2
7f85f819-1280-4514-a856-833dab771525	445ccba1-2875-4eb4-b732-19f0005caede	Welcome to Talent Bridge!	Complete your profile to get started and find your perfect match.	INFO	onboarding	\N	f	\N	\N	2026-02-27 06:46:39.932	2026-02-27 06:46:39.932
8bf48127-314d-48ac-9120-8095724a3799	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	Senior Full Stack Developer at TechCorp Solutions matches your profile (100% match)	SUCCESS	job_match	/jobs/be7b7aed-539e-4d25-8948-54522539d34b	f	\N	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "matchScore": 1}	2026-02-27 07:02:35.897	2026-02-27 07:02:35.897
b99c0695-d9b1-4960-8000-8c50c7f309f3	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	Senior Full Stack Developer at TechCorp Solutions matches your profile (100% match)	SUCCESS	job_match	/jobs/be7b7aed-539e-4d25-8948-54522539d34b	f	\N	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "matchScore": 1}	2026-02-27 07:02:35.9	2026-02-27 07:02:35.9
a88e47ca-b35e-4d81-9975-8b8027340cf1	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	ML Engineer - Healthcare AI at StartupX Labs matches your profile (83% match)	SUCCESS	job_match	/jobs/0c6bb563-ab18-4c80-8659-f6a20301fa1a	f	\N	{"jobId": "0c6bb563-ab18-4c80-8659-f6a20301fa1a", "matchScore": 0.8285714285714286}	2026-02-27 07:02:36.424	2026-02-27 07:02:36.424
09d86210-2b10-48f8-923f-738beebb478a	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	ML Engineer - Healthcare AI at StartupX Labs matches your profile (83% match)	SUCCESS	job_match	/jobs/0c6bb563-ab18-4c80-8659-f6a20301fa1a	f	\N	{"jobId": "0c6bb563-ab18-4c80-8659-f6a20301fa1a", "matchScore": 0.8285714285714286}	2026-02-27 07:02:36.426	2026-02-27 07:02:36.426
a88fcef2-8a7d-4303-a300-f65e17e9f42c	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	Frontend Developer (React) at StartupX Labs matches your profile (83% match)	SUCCESS	job_match	/jobs/4a6dcee8-99b1-420c-bd16-5c37fbe587c7	f	\N	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "matchScore": 0.8285714285714286}	2026-02-27 07:02:37.029	2026-02-27 07:02:37.029
bb08e2f1-c426-4005-9e0f-cc85b75243dc	445ccba1-2875-4eb4-b732-19f0005caede	New Job Match	Frontend Developer (React) at StartupX Labs matches your profile (83% match)	SUCCESS	job_match	/jobs/4a6dcee8-99b1-420c-bd16-5c37fbe587c7	t	2026-02-27 07:06:01.562	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "matchScore": 0.8285714285714286}	2026-02-27 07:02:37.031	2026-02-27 07:06:01.562
61d0e76c-64d0-44a1-a3e9-9c8061237bbb	7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	Welcome to Talent Bridge!	Complete your profile to get started and find your perfect match.	INFO	onboarding	\N	f	\N	\N	2026-02-27 07:24:07.628	2026-02-27 07:24:07.628
3b621f6b-d298-4569-aa0a-5443ee455cc7	88a66c49-ce6a-4e81-8e25-520a8d22f304	New Job Match	DevOps Engineer at TechCorp Solutions matches your profile (100% match)	SUCCESS	job_match	/jobs/513001cc-941d-450f-a722-0e40c5b9efd4	t	2026-02-27 08:50:58.305	{"jobId": "513001cc-941d-450f-a722-0e40c5b9efd4", "matchScore": 1}	2026-02-26 08:35:59.002	2026-02-27 08:50:58.305
e8903127-e017-4d8e-95fa-38933d4ce1f4	6381ec6b-663c-46b0-b786-6101da4d6c77	Verification Request	StartupX Labs has submitted a GST verification request.	WARNING	verification	/admin/verifications	t	2026-02-27 10:58:06.863	\N	2026-02-13 10:40:51.545	2026-02-27 10:58:06.864
aa9929ee-7334-4823-a555-e99b54b82032	88a66c49-ce6a-4e81-8e25-520a8d22f304	New Job Match	ML Engineer - Healthcare AI at StartupX Labs matches your profile (100% match)	SUCCESS	job_match	/jobs/0c6bb563-ab18-4c80-8659-f6a20301fa1a	t	2026-02-27 08:50:58.305	{"jobId": "0c6bb563-ab18-4c80-8659-f6a20301fa1a", "matchScore": 1}	2026-02-26 08:35:59.438	2026-02-27 08:50:58.305
5f7f5242-353e-4ac7-8805-0269e5ca3e8c	88a66c49-ce6a-4e81-8e25-520a8d22f304	New Job Match	Frontend Developer (React) at StartupX Labs matches your profile (100% match)	SUCCESS	job_match	/jobs/4a6dcee8-99b1-420c-bd16-5c37fbe587c7	t	2026-02-27 08:50:58.305	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "matchScore": 1}	2026-02-26 08:36:00.103	2026-02-27 08:50:58.305
e51e43e3-032f-449a-85b4-6561bf9664bb	88a66c49-ce6a-4e81-8e25-520a8d22f304	New Job Match	Senior Full Stack Developer at TechCorp Solutions matches your profile (85% match)	SUCCESS	job_match	/jobs/be7b7aed-539e-4d25-8948-54522539d34b	t	2026-02-27 08:50:58.305	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "matchScore": 0.8484848484848485}	2026-02-26 08:36:00.739	2026-02-27 08:50:58.305
cbed2920-ea35-4a71-8474-66088a85fb8a	88a66c49-ce6a-4e81-8e25-520a8d22f304	New Job Match	Senior Full Stack Developer at TechCorp Solutions matches your profile (85% match)	SUCCESS	job_match	/jobs/be7b7aed-539e-4d25-8948-54522539d34b	t	2026-02-27 08:50:58.305	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "matchScore": 0.8484848484848485}	2026-02-26 08:36:00.944	2026-02-27 08:50:58.305
74384c10-684f-4eac-ba69-a054810de7f8	88a66c49-ce6a-4e81-8e25-520a8d22f304	Application Submitted	Your application for DevOps Engineer at TechCorp Solutions has been submitted successfully.	SUCCESS	application_update	/candidate/applications	f	\N	{"jobId": "513001cc-941d-450f-a722-0e40c5b9efd4"}	2026-02-27 11:11:11.016	2026-02-27 11:11:11.016
b0f4f3dd-e2d0-4f79-b2f5-a4c5b2fbec0e	af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	New Application	Test User applied for DevOps Engineer	INFO	application_update	/employer/jobs/513001cc-941d-450f-a722-0e40c5b9efd4/applications	f	\N	{"jobId": "513001cc-941d-450f-a722-0e40c5b9efd4", "applicationId": "301c4f5f-d0d8-42e1-a193-e75f62af07d5"}	2026-02-27 11:11:11.015	2026-02-27 11:11:11.015
59e56a2b-9411-48d0-b748-b55dc442cdd9	af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	Application Withdrawn	Test User withdrew their application for "Senior Full Stack Developer".	INFO	application_update	/employer/jobs/be7b7aed-539e-4d25-8948-54522539d34b/applications	f	\N	{"jobId": "be7b7aed-539e-4d25-8948-54522539d34b", "candidateName": "Test User"}	2026-02-28 09:44:52.403	2026-02-28 09:44:52.403
c0ce548c-90d9-4f44-a842-3b96ab0e32f6	88a66c49-ce6a-4e81-8e25-520a8d22f304	Application Update	You have been shortlisted! - Frontend Developer (React) at StartupX Labs	SUCCESS	application_update	/candidate/applications	f	\N	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "status": "SHORTLISTED"}	2026-02-28 10:01:50.393	2026-02-28 10:01:50.393
e0214ad6-fc10-4646-89e9-05e782f7a196	88a66c49-ce6a-4e81-8e25-520a8d22f304	Application Update	You have been selected for further evaluation! - Frontend Developer (React) at StartupX Labs	SUCCESS	application_update	/candidate/applications	f	\N	{"jobId": "4a6dcee8-99b1-420c-bd16-5c37fbe587c7", "status": "SELECTED"}	2026-02-28 10:02:59.788	2026-02-28 10:02:59.788
\.


--
-- Data for Name: ProfileView; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProfileView" (id, "viewerId", "profileUserId", "viewType", "createdAt") FROM stdin;
\.


--
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PushSubscription" (id, "userId", endpoint, p256dh, auth, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshToken" (id, token, "userId", "expiresAt", "isRevoked", "createdAt", "userAgent", "ipAddress", "sessionId") FROM stdin;
5465610d1d922f577ecd59ae4f9ff5cf	1f5acff548384dd0f82558991831d73e539c718b31c9d58af763d91690d95587	f1df12f6-6825-4ffa-8fd5-1d5d511458c4	2026-03-18 09:03:01.886	f	2026-02-16 09:03:01.9	curl/8.17.0	::1	\N
129d6bedf6dcc2ef03a12dc81ddf49a7	d28d361f340d99f60ec983aa5a7d7d23c83d7afdeb5d1696465a8c49b4329b25	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	2026-03-28 12:24:03.151	f	2026-02-26 12:24:03.157	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.18.31.4	\N
0feaf8300cac9b1b83d49f18131ad783	9eb30ff7e95810f525e49a491df14865c96fb330723a1c6e62a172188787e634	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	2026-03-29 05:39:40.411	f	2026-02-27 05:39:40.412	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15	10.17.110.147	\N
f30db05b21f49ac8c59ef3a13d1d6a81	2ef954941197bbe5cb474b0603459163fd88e9d4e63bfc6ff5a3c57e93c6ae47	47e36905-1f10-4e8a-9d5b-d463c475a69f	2026-03-19 10:23:05.855	f	2026-02-17 10:23:05.856	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	\N
0b3cde653abf33e8db49fdfdcfb3a411	7abdd7b76d612fc083365547768bbe55cc02a0031433d801735d48438844c4d5	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-29 06:20:38.725	f	2026-02-27 06:20:38.726	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	\N
67ca4a8775a83f698e052bb10412ee8a	6f2613493865dbc494fe624f0810adb2e479e1d2e14368ecca52e13f28d150b6	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-21 11:28:08.838	f	2026-02-19 11:28:08.841	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.39.27	\N
5e5b3d29dd0e4ba7df6f5551125ee65c	47cbf333817c97392f7a0894d00e9a501a64c3599a1e5a8f8aa3b4cd8a2436a3	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-20 15:14:16.783	t	2026-02-18 15:14:16.788	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	\N
11728d79c7c07b9fa7aa1b4022869d76	493a4f000a869bd11603ec1e699f3412e24e601a934ae4569d1c446876a47cd4	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-27 09:49:28.109	f	2026-02-25 09:49:28.123	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	\N
edc4c6cbf4d5c39612c8a3a37c922f4b	5d7e4c18d0e5bc719fde26e63b451bdaf8f9ed7a29e449ebf734512e574c6d93	445ccba1-2875-4eb4-b732-19f0005caede	2026-03-29 06:47:42.176	t	2026-02-27 06:47:42.177	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	\N
6b86c4dd0a42a76c94e79a29a44117c8	8f5f44720e44f14234d6e63604b4fd374cdab11d18cc1f80bb983fab46fdf00c	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-21 12:12:52.251	f	2026-02-19 12:12:52.252	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.16.52.138	\N
8f0531c2fce2118c7c99f2dccc728dbd	5c9cdb18047cb3dc8b36648802b982960e898f57ee0e5ca75d7509d420234a62	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-21 12:13:32.451	f	2026-02-19 12:13:32.452	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.39.27	\N
14f37881e4ff3be032233ef737d3deaf	627b5d6a758e05dcdf27f5f18e7fdbe41d3f5abf8cf5276448823aaf315b3ba4	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-20 05:52:41.825	t	2026-02-18 05:52:41.828	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	\N
a534bd14cb7b8271040ad6f3966dcace	3d6a1e413635a398707cd7649f4db7eb935d8fd373a7211c9c17c55f4cd0bab0	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-28 01:37:46.032	t	2026-02-26 01:37:46.049	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	\N
50d8c33d2d6e98822eb7da7550d9224e	98e8613a4409963de6964f91700c8cddeb07d2897d2d0669f163f050156ddd3c	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-28 01:39:12.712	t	2026-02-26 01:39:12.713	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.19.109.67	\N
4615577b50aceb04d8832844555a825f	c056bb81695977a4dda5d5f67150e7b9527b78d67f64c3e34a609b2420e397bf	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	2026-03-28 10:13:11.496	t	2026-02-26 10:13:11.497	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	\N
ce1174783dbce8d4af983d53d7f163d3	8d2b526e2e79d111d39bac1b2efd1003348b0f3e5288810db3d20a00fcfa71ff	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-28 10:34:37.294	f	2026-02-26 10:34:37.297	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.18.31.4	\N
afa937fa8f87762cb8b5f2a165206857	4c594d8ae552325f110da654333c9c51e1b7c1e59e17b8c26e8b1a1046a05f98	445ccba1-2875-4eb4-b732-19f0005caede	2026-03-29 07:22:15.099	t	2026-02-27 07:22:15.123	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	\N
c4e5a49a742c57b465a180bc535b85e3	eeb77622103e5a3ac53effe203e92b0021532b68a939df40bdad26e386d9f9d7	7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	2026-03-29 07:25:51.021	f	2026-02-27 07:25:51.022	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	\N
a8d0a53cb1dfc925efe243580884092d	26fe78e7102787e897c86a74a91b471e9a305d92889e06825377beec1e4a767a	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-29 07:37:50.991	t	2026-02-27 07:37:50.992	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	\N
dd2f0e77fa3744c43f58097fa5f76287	78e589fa47c42066f0ec5c83218496fc07034d8119043d0c0faaf60644b09c2b	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-21 05:07:06.865	t	2026-02-19 05:07:06.868	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.23.120.65	\N
488b7768d5f1c51e77347c0854852274	1b319e1d3de6e052204bdfdce647120094e0c76b1ee50903d2937f2596886240	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-29 08:43:58.924	t	2026-02-27 08:43:58.925	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	\N
752c0508b29309cb7be079d50e9b845f	7e7ad3ba8bbf5007c384c899d8601924189bc21c11954c492b255e3bb71910c6	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-29 10:42:46.209	t	2026-02-27 10:42:46.213	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	\N
6af4c568d106c96963a56f1f6356f958	7a3dd49394bd83bc782fc7a8206485c751376de95a56979d0879ed4dd1a56dec	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	2026-03-29 11:17:05.472	f	2026-02-27 11:17:05.473	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	\N
6e58b6d438a0477bf89e39957d93651e	79d6db514a0695fa0b9b8bdf18f8e1584cb856840b7f3cd386bd22cdacefdbb2	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-29 10:48:54.074	t	2026-02-27 10:48:54.075	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	10.17.110.147	\N
79c6d8906f0e8d376913489ee5ff8e07	563970358e0eb56b63538c486888954161e20ead030e00af08ad276315475075	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-30 07:41:55.298	t	2026-02-28 07:41:55.302	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.32.194	\N
2cc0c1d4136cd9d8fb24aa95c3753013	a48f81d14cfae179d7b06abaa5d2ba5f7cd56232455e2f3f6c4667137ed70eab	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-30 09:39:13.348	t	2026-02-28 09:39:13.351	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.217.29	\N
5f08cfe7dc70d8531e2491bdb947a553	679cfabb59b95e46616dc6fa4dc0827c4a01f35b15aa7974e5eb6946c9367abb	88a66c49-ce6a-4e81-8e25-520a8d22f304	2026-03-30 09:40:44.056	t	2026-02-28 09:40:44.057	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.217.29	\N
694c14b632a0cf38609e3f30420b6e84	9fbdadc5d6ace916b243ab67dc109325ed95c7e349e93c697bf267ed68f8cd3c	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	2026-03-30 09:50:50.247	t	2026-02-28 09:50:50.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.98.3	\N
1fe6634d45604f8f2469830162c9706b	2560b81f76fcab87aa8fd49d76d9075a51bf181cc23a0994418c228855598ba0	6381ec6b-663c-46b0-b786-6101da4d6c77	2026-03-30 11:49:30.315	f	2026-02-28 11:49:30.316	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.32.194	\N
0dc35133416354a809cf020a4f6d9a7b	3906f30ebd4c0d8108f385d92354da69702b1b79ba38bfe25457c1e474d4d111	dd85f170-ad09-4a44-8785-54e0acc77f73	2026-03-30 09:59:45.045	t	2026-02-28 09:59:45.046	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.98.3	\N
ee40c45da0e905663cc708aa86c4fbcc	8350151212566ecaf456c1580189c69c1ff989a0229320b9a7ad93b4a6720748	dd85f170-ad09-4a44-8785-54e0acc77f73	2026-04-01 09:12:12.173	f	2026-03-02 09:12:12.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.19.240.197	\N
\.


--
-- Data for Name: SavedCandidate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SavedCandidate" (id, "employerId", "candidateId", notes, "savedAt") FROM stdin;
\.


--
-- Data for Name: SavedJob; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SavedJob" (id, "userId", "jobId", "createdAt") FROM stdin;
dafb9201-3ba3-47c9-8e3d-6ae7cd55e28f	88a66c49-ce6a-4e81-8e25-520a8d22f304	4a6dcee8-99b1-420c-bd16-5c37fbe587c7	2026-02-18 06:01:46.856
fef326ac-40e1-459e-bf2c-82c842315860	88a66c49-ce6a-4e81-8e25-520a8d22f304	be7b7aed-539e-4d25-8948-54522539d34b	2026-02-19 11:42:01.101
86bdf447-736b-4ce7-8d54-06a49b5eced9	445ccba1-2875-4eb4-b732-19f0005caede	be7b7aed-539e-4d25-8948-54522539d34b	2026-02-27 07:08:53.603
\.


--
-- Data for Name: SavedSearch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SavedSearch" (id, "userId", name, "searchType", filters, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScreeningAnswer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScreeningAnswer" (id, "applicationId", "questionId", answer, "createdAt") FROM stdin;
\.


--
-- Data for Name: ScreeningQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScreeningQuestion" (id, "jobId", question, "questionType", "isRequired", "isDealBreaker", options, "idealAnswer", "displayOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "userId", "userAgent", "ipAddress", "isActive", "createdAt", "lastSeenAt", "updatedAt") FROM stdin;
41b6c791-1666-49f7-acc9-c4b925e8d266	f1df12f6-6825-4ffa-8fd5-1d5d511458c4	curl/8.17.0	::1	t	2026-02-16 09:03:02.396	2026-02-16 09:03:02.396	2026-02-19 12:09:53.905
42767ad9-7703-4b3f-97e7-cb5b414acb21	22a62fcc-dc6c-4a82-b89c-934682667ea2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-16 09:38:09.424	2026-02-16 09:38:09.424	2026-02-19 12:09:53.905
4e0f0efd-de49-4d94-8487-3aa72b586605	c369ccbf-13b7-41da-9d3e-9e8c0a22587f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-16 09:51:49.822	2026-02-16 09:51:49.822	2026-02-19 12:09:53.905
90fd5dbc-3070-49b8-969b-cf80bbe0d66c	c369ccbf-13b7-41da-9d3e-9e8c0a22587f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-16 09:57:47.789	2026-02-16 09:57:47.789	2026-02-19 12:09:53.905
623be5c8-b929-46fc-896e-6dfad3b7d7cc	47e36905-1f10-4e8a-9d5b-d463c475a69f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 10:23:06.054	2026-02-17 10:23:06.054	2026-02-19 12:09:53.905
a3935af3-d0ad-4a4f-8611-a4e73672e211	47e36905-1f10-4e8a-9d5b-d463c475a69f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 11:14:20.766	2026-02-17 11:14:20.766	2026-02-19 12:09:53.905
ada622c5-57ee-4eee-9a4d-e5b9bf447e36	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 13:13:55.099	2026-02-17 13:13:55.099	2026-02-19 12:09:53.905
eace3296-dc02-4b3e-a2a1-da7e6a226364	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 13:24:01.177	2026-02-17 13:24:01.177	2026-02-19 12:09:53.905
fe46310b-d398-4983-8757-b51eaef615d7	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 13:24:49.424	2026-02-17 13:24:49.424	2026-02-19 12:09:53.905
3644629c-ed87-466c-a990-a71c6e757e3d	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 15:11:28.814	2026-02-17 15:11:28.814	2026-02-19 12:09:53.905
6f079834-a9ff-4266-a0df-789f3742425c	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 15:23:44.058	2026-02-17 15:23:44.058	2026-02-19 12:09:53.905
0488b308-e202-4374-862f-dfb95ae37ee5	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 15:51:04.569	2026-02-17 15:51:04.569	2026-02-19 12:09:53.905
777b6ac9-bfd0-4acc-8d33-4e1ab0ed769c	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	::1	t	2026-02-17 17:10:30.459	2026-02-17 17:10:30.459	2026-02-19 12:09:53.905
8a60b922-a874-43ff-b73f-f8381181cb9f	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	t	2026-02-18 05:52:42.136	2026-02-18 05:52:42.136	2026-02-19 12:09:53.905
4473d0cd-314e-4a61-addf-b4ca9a588d46	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	t	2026-02-18 15:14:17.197	2026-02-18 15:14:17.197	2026-02-19 12:09:53.905
524a1a05-882d-4209-aa6d-e3d289379320	e9538603-ee16-4226-91b8-35c1fda139f0	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	10.23.120.65	t	2026-02-19 02:56:27.044	2026-02-19 02:56:27.044	2026-02-19 12:09:53.905
7e7a60a0-a9ee-4680-98d3-d4a03c81a865	e9538603-ee16-4226-91b8-35c1fda139f0	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	10.16.52.138	t	2026-02-19 03:03:39.946	2026-02-19 03:03:39.946	2026-02-19 12:09:53.905
54706b10-26f1-42f4-8626-5cfc2c920739	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.23.120.65	t	2026-02-19 05:07:07.268	2026-02-19 05:07:07.268	2026-02-19 12:09:53.905
e3f148f1-0f76-45d8-9013-1219dc4443b1	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.39.27	t	2026-02-19 11:28:09.236	2026-02-19 11:28:09.236	2026-02-19 12:09:53.905
0833cbed-480b-48c5-8084-faedc2c376de	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.39.27	t	2026-02-19 11:40:41.154	2026-02-19 11:40:41.154	2026-02-19 12:09:53.905
3b36dd91-a7cb-4750-9a4d-df7614b8f1c5	79dccb85-2d52-4afd-a9f1-7ac971621d1a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.5.8	t	2026-02-19 11:53:13.025	2026-02-19 11:53:13.025	2026-02-19 12:09:53.905
07498dbb-662f-4da4-819e-0a75d34cc8fa	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.16.52.138	t	2026-02-19 12:12:52.412	2026-02-19 12:12:52.412	2026-02-19 12:12:52.438
27c59fa5-e25e-4bde-afbe-8981b9f64889	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.39.27	t	2026-02-19 12:13:32.588	2026-02-19 12:13:32.588	2026-02-19 12:13:32.613
a26faadf-f4f5-4b2a-b601-95859afaa0f8	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::1	t	2026-02-25 09:49:40.87	2026-02-25 09:49:40.87	2026-02-25 09:49:40.87
bc604e46-c35b-46c6-8404-b7dd77b8d902	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	t	2026-02-26 01:37:46.402	2026-02-26 01:37:46.402	2026-02-26 01:37:46.402
d3ea7c6e-e41f-44a9-9b55-b8f3307a5371	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.19.109.67	t	2026-02-26 01:39:12.847	2026-02-26 01:39:12.847	2026-02-26 01:39:12.847
e8d0fb32-6d17-4ce8-aff5-51eb8579b541	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	t	2026-02-26 10:13:11.641	2026-02-26 10:13:11.641	2026-02-26 10:13:11.641
50c64fdf-ca18-4e34-8be8-331a1d8ed154	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.18.31.4	t	2026-02-26 10:34:37.493	2026-02-26 10:34:37.493	2026-02-26 10:34:37.493
a127cbec-941c-49c9-bdf4-46c994892309	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.18.31.4	t	2026-02-26 12:24:03.452	2026-02-26 12:24:03.452	2026-02-26 12:24:03.452
e165ebde-493a-436b-a5b5-60edbc5a95a4	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15	10.17.110.147	t	2026-02-27 05:39:40.579	2026-02-27 05:39:40.579	2026-02-27 05:39:40.579
eeb1885a-7ca3-4919-ba34-489e93c6db94	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	t	2026-02-27 06:20:39.07	2026-02-27 06:20:39.07	2026-02-27 06:20:39.07
99db7009-ec00-479e-ace4-455e806ae9b8	445ccba1-2875-4eb4-b732-19f0005caede	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	t	2026-02-27 06:47:42.326	2026-02-27 06:47:42.326	2026-02-27 06:47:42.326
6a9335e5-1fd2-46e1-b6d2-29b26e8d41c2	445ccba1-2875-4eb4-b732-19f0005caede	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	t	2026-02-27 07:22:15.273	2026-02-27 07:22:15.273	2026-02-27 07:22:15.273
8b0fe06a-c88b-4c33-a7c9-90b59ac09be9	7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	t	2026-02-27 07:25:51.162	2026-02-27 07:25:51.162	2026-02-27 07:25:51.162
edbd0207-f8ca-4884-b99b-eec2c47d6009	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.17.110.147	t	2026-02-27 07:37:51.129	2026-02-27 07:37:51.129	2026-02-27 07:37:51.129
b78cb33e-7492-42fa-a1af-9261d9c5143c	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.245.65	t	2026-02-27 08:43:59.276	2026-02-27 08:43:59.276	2026-02-27 08:43:59.276
72160fe6-e52c-4b82-98a0-22dcb861daa1	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	t	2026-02-27 10:42:46.503	2026-02-27 10:42:46.503	2026-02-27 10:42:46.503
ef8ee594-0282-44bc-904b-8ce8218ce4d9	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	10.17.110.147	t	2026-02-27 10:48:54.207	2026-02-27 10:48:54.207	2026-02-27 10:48:54.207
bb8066ce-f9fe-4669-861d-053d1072ba8f	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.22.202.27	t	2026-02-27 11:17:05.614	2026-02-27 11:17:05.614	2026-02-27 11:17:05.614
1591dcfc-b6a0-450c-9319-747acd1ff3b1	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.32.194	t	2026-02-28 07:41:55.597	2026-02-28 07:41:55.597	2026-02-28 07:41:55.597
87b99a13-9188-486c-ba18-a4ed15bfdcb7	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.217.29	t	2026-02-28 09:39:13.498	2026-02-28 09:39:13.498	2026-02-28 09:39:13.498
6d6e583f-9f42-42a3-a533-bdad5740d74c	88a66c49-ce6a-4e81-8e25-520a8d22f304	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.21.217.29	t	2026-02-28 09:40:44.208	2026-02-28 09:40:44.208	2026-02-28 09:40:44.208
3f563c6e-d84c-4fc7-9a14-97843a24b1a8	76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.98.3	t	2026-02-28 09:50:50.388	2026-02-28 09:50:50.388	2026-02-28 09:50:50.388
711b4b01-797a-4f24-b4c9-5dab95641fdd	dd85f170-ad09-4a44-8785-54e0acc77f73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.98.3	t	2026-02-28 09:59:45.182	2026-02-28 09:59:45.182	2026-02-28 09:59:45.182
bcbb91b9-174a-4c2b-ab93-00259a38d51d	6381ec6b-663c-46b0-b786-6101da4d6c77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	10.20.32.194	t	2026-02-28 11:49:30.472	2026-02-28 11:49:30.472	2026-02-28 11:49:30.472
\.


--
-- Data for Name: SupportTicket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupportTicket" (id, "ticketNumber", subject, description, status, priority, category, "userId", "guestName", "guestEmail", "assignedToId", satisfaction, "satisfactionComment", "resolvedAt", "closedAt", "firstResponseAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SystemConfig" (id, key, value, "updatedBy", "updatedAt", "createdAt") FROM stdin;
ce5f5b40-797e-44f5-9558-57937ed4d504	maintenance_mode	{"enabled": false, "message": ""}	1ca12098-8068-4e19-879b-934fc1f474f3	2026-02-13 10:40:51.603	2026-02-13 10:40:51.603
999b3064-d753-44eb-b435-11f57a363c56	job_expiry_days	{"default": 30, "premium": 60}	1ca12098-8068-4e19-879b-934fc1f474f3	2026-02-13 10:40:51.668	2026-02-13 10:40:51.668
f82929ff-f247-4e8d-acbc-1545937c1ab7	max_applications_per_day	{"candidate": 25}	1ca12098-8068-4e19-879b-934fc1f474f3	2026-02-13 10:40:51.724	2026-02-13 10:40:51.724
a9c0bc34-e710-4cd8-9e45-07dd6a2dd6e0	feature_flags	{"mfa": true, "whatsapp": false, "ai_matching": true, "premium_jobs": false}	1ca12098-8068-4e19-879b-934fc1f474f3	2026-02-13 10:40:51.78	2026-02-13 10:40:51.78
\.


--
-- Data for Name: TicketMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TicketMessage" (id, "ticketId", "senderId", "senderType", "senderName", body, "isInternal", "createdAt", subject) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, role, "firstName", "lastName", avatar, "googleId", "linkedinId", "mobileNumber", "isMobileVerified", "mobileVerificationToken", "mobileVerificationExpires", "isWhatsappVerified", "isEmailVerified", "emailVerificationToken", "emailVerificationExpires", "passwordResetToken", "passwordResetExpires", "mfaSecret", "mfaEnabled", "mfaBackupCodes", "loginAttempts", "lockUntil", "lastLoginAt", "lastLoginIp", "createdAt", "updatedAt", "isActive", "isSuspended", "lastActiveAt", "suspendedAt", "suspendedBy", "whatsappVerificationExpires", "whatsappVerificationToken", "deletionRequestedAt", "emailOtpLastSentAt", "emailOtpResendCount", "mobileOtpLastSentAt", "mobileOtpResendCount", "whatsappOtpLastSentAt", "whatsappOtpResendCount", "pendingEmail", "pendingMobileNumber", "whatsappNumber", "mfaRecoveryExpires", "mfaRecoveryToken") FROM stdin;
1ca12098-8068-4e19-879b-934fc1f474f3	superadmin@talentbridge.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	SUPER_ADMIN	Super	Admin	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:45.655	2026-02-13 10:40:45.655	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
af6b5b44-f5e3-4e35-9ce9-6ab8e312f3e5	hr@techcorp.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	EMPLOYER	Priya	Sharma	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:46.448	2026-02-13 10:40:46.448	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
3b5f6375-de2a-4359-a75c-72bd9ec017e4	rahul.dev@gmail.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	CANDIDATE	Rahul	Kumar	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:47.005	2026-02-13 10:40:47.005	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
a32e15b1-9d2b-4a41-9a75-df4de859530a	sneha.data@gmail.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	CANDIDATE	Sneha	Patel	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:47.006	2026-02-13 10:40:47.006	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
01cb027d-9239-41e4-87ea-05735144f176	amit.devops@gmail.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	CANDIDATE	Amit	Joshi	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:47.01	2026-02-13 10:40:47.01	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
b8359dda-0144-481c-b661-69b09d15d724	arjun.full@gmail.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	CANDIDATE	Arjun	Singh	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:47.007	2026-02-13 10:40:47.007	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
fd46ba43-d5a9-4fa5-a31b-37c73c18ce8c	neha.design@gmail.com	$2b$12$iUYGf.hCNEYCnl8arQLmHO0FtUg6GljoPAs36OtoQ8Bwwgr3N958W	CANDIDATE	Neha	Gupta	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-13 10:40:47.009	2026-02-13 10:40:47.009	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
f1df12f6-6825-4ffa-8fd5-1d5d511458c4	test-debug-1771232579@example.com	$2b$12$GxC52obBG16NUrYkRKfqt.g8E.QdVK9cDLVHru9Eas8UtM2yOyUse	CANDIDATE	John	Doe	\N	\N	\N	\N	f	\N	\N	f	f	69a3c1bb6153fcf0969a1832da765570266ffe78705467af621bac38a197cf22	2026-02-17 09:03:01.644	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-16 09:03:01.688	2026-02-16 09:03:01.688	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
22a62fcc-dc6c-4a82-b89c-934682667ea2	chanderbhan.technotaau@gmail.com	$2b$12$12hLluHdeka05zfI2/VZmOldudA/x924rlvzMpyoy4uKV/jMl6QD6	CANDIDATE	Test	Candidate	\N	\N	\N	9602447986	f	2d5b39c436566bb44f8faded25028cc55bfb51dec82d78c8f27cd939e1d459cc	2026-02-16 09:48:09.223	f	f	2e27b347a505aac5aa904fa8796ec8a0d5bb38518c2c1693af15a04cebeb5328	2026-02-17 09:38:08.695	\N	\N	\N	f	{}	0	\N	\N	\N	2026-02-16 09:38:08.881	2026-02-16 09:38:09.265	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
c369ccbf-13b7-41da-9d3e-9e8c0a22587f	dev@technotaau.com	$2b$12$DWpsQpskWWUPo/H95CbcJ.0hAhfWSP3F/Nb1e7eGnyXe7lVcrBYXK	EMPLOYER	Test	Manager	\N	\N	\N	\N	f	\N	\N	f	f	0eb83a43899c18d2ee2d4b14fd46427b55999a1da9660a4f34b551458ace0831	2026-02-17 09:51:49.443	\N	\N	\N	f	{}	0	\N	2026-02-16 09:57:38.04	::1	2026-02-16 09:51:49.445	2026-02-16 09:57:38.098	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
47e36905-1f10-4e8a-9d5b-d463c475a69f	chanderbhanswami32@gmail.com	$2b$12$IAvsQLdASAy8fFSXEtbUp.71BMJIlmXsysq77Lb0f.0AObyzZYUmK	CANDIDATE	Test	Candidate	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-17 11:14:20.442	::1	2026-02-17 10:20:19.187	2026-02-17 11:14:20.449	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
e9538603-ee16-4226-91b8-35c1fda139f0	send@technotaau.com	$2b$12$ahHl3n992IAu0tvAp9rYn.PySvq6zLn35zO/hVzVET8PNL3KhrnbS	CANDIDATE	Temp	Test	\N	\N	\N	1234567890	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-19 03:03:39.649	10.16.52.138	2026-02-19 02:55:49.249	2026-02-19 03:03:39.65	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
6381ec6b-663c-46b0-b786-6101da4d6c77	admin@talentbridge.com	$2b$12$l1APyGs6vexH3RFR8qP5r.FKmzeUcaFod5xHDsWKXehT8/zvEmnqy	SUPER_ADMIN	Super	Admin	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	qIIO9tH+yKvvfHXL:Q4zjc2+VrZ7EgcI1SwtJwQ==:5aPlPyRJqBlcQEilxy+uXihkCqjg+Pf3WiYKBb0AdII5rx4AoEMh5XkcLet6qjjYr1/gyg==	t	{2fc14ef9543960c59644bb420f525bafb8e61912646f7314a9a4444d1ca0107b,7f969ab21f5a57dd9d1e91884c5bc075d1feea29ac88785654e727281208a916,a98cad688d9c53c714650a840ab3b0a56cc16f5da4604c8f6d30a75b88fb28b6,b7337f08df311189f8b4a5f77a631a8225a6151dee78ee060e3aeef6e440d86e,879190c8b2e75616f91df90c64048342c166f05755f55f8858cc4c476cc76a82,642f31f7521edda39305bda53a7b010c01215724eaae249cd47f8720f55e46e4,137e2a8647c93d7f15486d6f1fe03f28e6a58e7afe70f8324a36b74c52c46727,1a9730b8f56c73364f40a3d0ad38747ecdfdd6e1f5856a76955ce67f574c43c2,2aa02692f9bb25c3f5027c9ae560f522c0836e34b5778d3b8aec2ea651b0d403,043da36f756685f368286760badd8f23b4044e0b6d4976b08735802527a51f97}	0	\N	2026-02-28 11:49:30.245	10.20.32.194	2026-02-13 10:40:08.983	2026-02-28 12:57:06.127	t	f	2026-02-28 12:57:06.115	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
79dccb85-2d52-4afd-a9f1-7ac971621d1a	chanderbhans801@gmail.com	$2b$12$GeUiHNnXb2gKkoPrk/9l0OKOhk4VMUcIO40wbFP6FFpeqPFAAJp/a	CANDIDATE	Test	Candidate	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-19 11:53:12.788	10.17.5.8	2026-02-19 11:52:32.552	2026-02-19 11:53:12.79	t	f	\N	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
dd85f170-ad09-4a44-8785-54e0acc77f73	stumpgrindinghouston@gmail.com	$2b$12$2kNPqnRfxaM4AA.LUGF9OuY0y8NfM/JWJlZJ3v3l0M0VZqPKs4x6u	EMPLOYER	Rahul	Verma	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-28 09:59:44.892	10.20.98.3	2026-02-13 10:40:46.723	2026-03-02 09:12:12.961	t	f	2026-03-02 09:12:12.959	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
7ab4fd74-3aa0-4689-a6e3-32288dbab7a1	suniljakhar507@gmail.com	$2b$12$ypo6vw4GnSuekBGMYdp5eez4yRtv4RE60Cm504vz4pwasSTIs/g5m	EMPLOYER	Jakhar	Singh	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	2	\N	2026-02-27 07:25:50.943	10.17.110.147	2026-02-27 07:24:07.235	2026-02-27 11:16:38.709	t	f	2026-02-27 11:14:29.966	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
445ccba1-2875-4eb4-b732-19f0005caede	officialsuniljakhar@gmail.com	$2b$12$jbG8gVSa4Z3AfCSmvpiORexBYP9SogrUOPFMwgVXmkppleHoSC.hq	CANDIDATE	Jakhar 	Singh	\N	\N	\N	\N	f	\N	\N	f	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-27 07:22:15.024	10.21.245.65	2026-02-27 06:46:37.131	2026-02-27 07:22:15.627	t	f	2026-02-27 07:22:15.624	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	\N	\N	\N
76e1c96a-88b8-44c5-b4f0-f3e4d8db2743	sunil@technotaau.com	$2b$12$AOcccq4Y7c3bXbhr.L7jV.4Z8ETPSDKhJBV3WY8aDECw315M4yfA2	EMPLOYER	Test	Manager	\N	\N	\N	\N	f	\N	\N	t	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-28 09:50:50.091	10.20.98.3	2026-02-26 10:12:03.203	2026-02-28 09:50:51.582	t	f	2026-02-28 09:50:51.543	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	+919829582024	\N	\N
88a66c49-ce6a-4e81-8e25-520a8d22f304	swamichanderbhan09@gmail.com	$2b$12$BP0jd.xjSw25cv.MG4qMRObgjhbbIFTvL8jiQXPS9KxFuG02EZ.aC	CANDIDATE	Test	User	https://res.cloudinary.com/dvyccnlre/image/upload/v1772186862/talent_bridge/profiles/b2ixrezrbwwhf6ijmikx.jpg	\N	\N	\N	f	\N	\N	t	t	\N	\N	\N	\N	\N	f	{}	0	\N	2026-02-28 09:40:43.98	10.21.217.29	2026-02-17 11:28:37.543	2026-02-28 09:45:47.635	t	f	2026-02-28 09:45:47.633	\N	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	\N	+919602447986	\N	\N
\.


--
-- Data for Name: UserConsent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserConsent" (id, "userId", type, version, "givenAt", "revokedAt", "ipAddress") FROM stdin;
\.


--
-- Data for Name: VerificationRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationRequest" (id, "userId", type, status, "documentUrl", data, "reviewedBy", "adminComments", "reviewedAt", "createdAt", "updatedAt", "escalatedAt", "escalatedBy", "escalationReason", priority, "approvalChain", "autoEscalated", "currentApprovalLevel", "slaDeadline") FROM stdin;
\.


--
-- Data for Name: WebAuthnCredential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WebAuthnCredential" (id, "userId", "credentialId", "publicKey", counter, transports, "deviceType", "backedUp", "friendlyName", "createdAt") FROM stdin;
\.


--
-- Data for Name: WebhookDelivery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WebhookDelivery" (id, "webhookId", event, payload, "statusCode", response, success, attempt, error, "createdAt") FROM stdin;
\.


--
-- Data for Name: WebhookEndpoint; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WebhookEndpoint" (id, "userId", url, secret, events, "isActive", description, "failureCount", "lastTriggeredAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
313c3ec6-9269-4dc8-b222-9be2263322b5	e61bef960127269d2626b7fe8eb4ba2a3a9bd244b0ff34dddd00e84d080d9b72	2026-02-10 07:36:08.815867+00	20260210073608_add_mobile_auth_fields	\N	\N	2026-02-10 07:36:08.476795+00	1
57ea81a8-dcdf-4632-b7fe-193b096cf84a	e2b828b70638eb87b504cc93a9d85b40be43fe00b4235390dbabe08bb58e600a	2026-02-21 07:43:22.593624+00	0_baseline		\N	2026-02-21 07:43:22.593624+00	0
ad3077bb-823e-4c28-b3cb-7a3377f9fbf9	ff6ad9b2182fae90b61e6993ae7bc35bc024565222c959f53afad42dd2954a58	2026-02-26 07:46:00.199033+00	0_init		\N	2026-02-26 07:46:00.199033+00	0
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CandidateListMember CandidateListMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateListMember"
    ADD CONSTRAINT "CandidateListMember_pkey" PRIMARY KEY (id);


--
-- Name: CandidateList CandidateList_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateList"
    ADD CONSTRAINT "CandidateList_pkey" PRIMARY KEY (id);


--
-- Name: CandidateProfile CandidateProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateProfile"
    ADD CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY (id);


--
-- Name: CompanyProfile CompanyProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyProfile"
    ADD CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY (id);


--
-- Name: ContactMessage ContactMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactMessage"
    ADD CONSTRAINT "ContactMessage_pkey" PRIMARY KEY (id);


--
-- Name: DeviceToken DeviceToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceToken"
    ADD CONSTRAINT "DeviceToken_pkey" PRIMARY KEY (id);


--
-- Name: DismissedRecommendation DismissedRecommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DismissedRecommendation"
    ADD CONSTRAINT "DismissedRecommendation_pkey" PRIMARY KEY (id);


--
-- Name: FormDraft FormDraft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormDraft"
    ADD CONSTRAINT "FormDraft_pkey" PRIMARY KEY (id);


--
-- Name: JobAlert JobAlert_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobAlert"
    ADD CONSTRAINT "JobAlert_pkey" PRIMARY KEY (id);


--
-- Name: JobApplication JobApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_pkey" PRIMARY KEY (id);


--
-- Name: JobCandidateMatch JobCandidateMatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobCandidateMatch"
    ADD CONSTRAINT "JobCandidateMatch_pkey" PRIMARY KEY (id);


--
-- Name: JobPost JobPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobPost"
    ADD CONSTRAINT "JobPost_pkey" PRIMARY KEY (id);


--
-- Name: JobTemplate JobTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobTemplate"
    ADD CONSTRAINT "JobTemplate_pkey" PRIMARY KEY (id);


--
-- Name: KnownDevice KnownDevice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnownDevice"
    ADD CONSTRAINT "KnownDevice_pkey" PRIMARY KEY (id);


--
-- Name: LoginLocation LoginLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoginLocation"
    ADD CONSTRAINT "LoginLocation_pkey" PRIMARY KEY (id);


--
-- Name: MfaTrustedDevice MfaTrustedDevice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MfaTrustedDevice"
    ADD CONSTRAINT "MfaTrustedDevice_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: ProfileView ProfileView_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileView"
    ADD CONSTRAINT "ProfileView_pkey" PRIMARY KEY (id);


--
-- Name: PushSubscription PushSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: SavedCandidate SavedCandidate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCandidate"
    ADD CONSTRAINT "SavedCandidate_pkey" PRIMARY KEY (id);


--
-- Name: SavedJob SavedJob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_pkey" PRIMARY KEY (id);


--
-- Name: SavedSearch SavedSearch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_pkey" PRIMARY KEY (id);


--
-- Name: ScreeningAnswer ScreeningAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreeningAnswer"
    ADD CONSTRAINT "ScreeningAnswer_pkey" PRIMARY KEY (id);


--
-- Name: ScreeningQuestion ScreeningQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreeningQuestion"
    ADD CONSTRAINT "ScreeningQuestion_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (id);


--
-- Name: TicketMessage TicketMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY (id);


--
-- Name: UserConsent UserConsent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationRequest VerificationRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationRequest"
    ADD CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY (id);


--
-- Name: WebAuthnCredential WebAuthnCredential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebAuthnCredential"
    ADD CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY (id);


--
-- Name: WebhookDelivery WebhookDelivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebhookDelivery"
    ADD CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY (id);


--
-- Name: WebhookEndpoint WebhookEndpoint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebhookEndpoint"
    ADD CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entity_idx" ON public."AuditLog" USING btree (entity);


--
-- Name: AuditLog_performedBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_performedBy_idx" ON public."AuditLog" USING btree ("performedBy");


--
-- Name: CandidateListMember_candidateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateListMember_candidateId_idx" ON public."CandidateListMember" USING btree ("candidateId");


--
-- Name: CandidateListMember_listId_candidateId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CandidateListMember_listId_candidateId_key" ON public."CandidateListMember" USING btree ("listId", "candidateId");


--
-- Name: CandidateListMember_listId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateListMember_listId_idx" ON public."CandidateListMember" USING btree ("listId");


--
-- Name: CandidateList_employerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateList_employerId_idx" ON public."CandidateList" USING btree ("employerId");


--
-- Name: CandidateProfile_city_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_city_state_idx" ON public."CandidateProfile" USING btree (city, state);


--
-- Name: CandidateProfile_currentIndustry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_currentIndustry_idx" ON public."CandidateProfile" USING btree ("currentIndustry");


--
-- Name: CandidateProfile_currentLocation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_currentLocation_idx" ON public."CandidateProfile" USING btree ("currentLocation");


--
-- Name: CandidateProfile_drivingLicenseType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_drivingLicenseType_idx" ON public."CandidateProfile" USING btree ("drivingLicenseType");


--
-- Name: CandidateProfile_experienceLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_experienceLevel_idx" ON public."CandidateProfile" USING btree ("experienceLevel");


--
-- Name: CandidateProfile_experienceYears_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_experienceYears_idx" ON public."CandidateProfile" USING btree ("experienceYears");


--
-- Name: CandidateProfile_functionalArea_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_functionalArea_idx" ON public."CandidateProfile" USING btree ("functionalArea");


--
-- Name: CandidateProfile_highestDegree_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_highestDegree_idx" ON public."CandidateProfile" USING btree ("highestDegree");


--
-- Name: CandidateProfile_highestEducationLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_highestEducationLevel_idx" ON public."CandidateProfile" USING btree ("highestEducationLevel");


--
-- Name: CandidateProfile_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_latitude_longitude_idx" ON public."CandidateProfile" USING btree (latitude, longitude);


--
-- Name: CandidateProfile_noticePeriod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_noticePeriod_idx" ON public."CandidateProfile" USING btree ("noticePeriod");


--
-- Name: CandidateProfile_openToWork_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_openToWork_idx" ON public."CandidateProfile" USING btree ("openToWork");


--
-- Name: CandidateProfile_profileCompleteness_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_profileCompleteness_idx" ON public."CandidateProfile" USING btree ("profileCompleteness");


--
-- Name: CandidateProfile_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_userId_idx" ON public."CandidateProfile" USING btree ("userId");


--
-- Name: CandidateProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON public."CandidateProfile" USING btree ("userId");


--
-- Name: CandidateProfile_willingToRelocate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_willingToRelocate_idx" ON public."CandidateProfile" USING btree ("willingToRelocate");


--
-- Name: CandidateProfile_workStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_workStatus_idx" ON public."CandidateProfile" USING btree ("workStatus");


--
-- Name: CandidateProfile_workStatus_noticePeriod_experienceYears_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandidateProfile_workStatus_noticePeriod_experienceYears_idx" ON public."CandidateProfile" USING btree ("workStatus", "noticePeriod", "experienceYears");


--
-- Name: CompanyProfile_cinNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CompanyProfile_cinNumber_key" ON public."CompanyProfile" USING btree ("cinNumber");


--
-- Name: CompanyProfile_city_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_city_state_idx" ON public."CompanyProfile" USING btree (city, state);


--
-- Name: CompanyProfile_companyName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_companyName_idx" ON public."CompanyProfile" USING btree ("companyName");


--
-- Name: CompanyProfile_companyType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_companyType_idx" ON public."CompanyProfile" USING btree ("companyType");


--
-- Name: CompanyProfile_fundingStage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_fundingStage_idx" ON public."CompanyProfile" USING btree ("fundingStage");


--
-- Name: CompanyProfile_gstNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CompanyProfile_gstNumber_key" ON public."CompanyProfile" USING btree ("gstNumber");


--
-- Name: CompanyProfile_industry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_industry_idx" ON public."CompanyProfile" USING btree (industry);


--
-- Name: CompanyProfile_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_latitude_longitude_idx" ON public."CompanyProfile" USING btree (latitude, longitude);


--
-- Name: CompanyProfile_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CompanyProfile_userId_idx" ON public."CompanyProfile" USING btree ("userId");


--
-- Name: CompanyProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON public."CompanyProfile" USING btree ("userId");


--
-- Name: ContactMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactMessage_createdAt_idx" ON public."ContactMessage" USING btree ("createdAt");


--
-- Name: ContactMessage_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactMessage_isRead_idx" ON public."ContactMessage" USING btree ("isRead");


--
-- Name: DeviceToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeviceToken_token_key" ON public."DeviceToken" USING btree (token);


--
-- Name: DeviceToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeviceToken_userId_idx" ON public."DeviceToken" USING btree ("userId");


--
-- Name: DismissedRecommendation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DismissedRecommendation_userId_idx" ON public."DismissedRecommendation" USING btree ("userId");


--
-- Name: DismissedRecommendation_userId_jobId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DismissedRecommendation_userId_jobId_key" ON public."DismissedRecommendation" USING btree ("userId", "jobId");


--
-- Name: FormDraft_userId_formType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormDraft_userId_formType_idx" ON public."FormDraft" USING btree ("userId", "formType");


--
-- Name: FormDraft_userId_formType_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FormDraft_userId_formType_name_key" ON public."FormDraft" USING btree ("userId", "formType", name);


--
-- Name: JobAlert_isActive_frequency_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobAlert_isActive_frequency_idx" ON public."JobAlert" USING btree ("isActive", frequency);


--
-- Name: JobAlert_userId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobAlert_userId_isActive_idx" ON public."JobAlert" USING btree ("userId", "isActive");


--
-- Name: JobApplication_candidateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_candidateId_idx" ON public."JobApplication" USING btree ("candidateId");


--
-- Name: JobApplication_candidateId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_candidateId_status_idx" ON public."JobApplication" USING btree ("candidateId", status);


--
-- Name: JobApplication_hiredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_hiredAt_idx" ON public."JobApplication" USING btree ("hiredAt");


--
-- Name: JobApplication_jobId_candidateId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JobApplication_jobId_candidateId_key" ON public."JobApplication" USING btree ("jobId", "candidateId");


--
-- Name: JobApplication_jobId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_jobId_idx" ON public."JobApplication" USING btree ("jobId");


--
-- Name: JobApplication_jobId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_jobId_status_idx" ON public."JobApplication" USING btree ("jobId", status);


--
-- Name: JobApplication_offeredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_offeredAt_idx" ON public."JobApplication" USING btree ("offeredAt");


--
-- Name: JobApplication_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_source_idx" ON public."JobApplication" USING btree (source);


--
-- Name: JobApplication_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobApplication_status_idx" ON public."JobApplication" USING btree (status);


--
-- Name: JobCandidateMatch_candidateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobCandidateMatch_candidateId_idx" ON public."JobCandidateMatch" USING btree ("candidateId");


--
-- Name: JobCandidateMatch_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobCandidateMatch_createdAt_idx" ON public."JobCandidateMatch" USING btree ("createdAt");


--
-- Name: JobCandidateMatch_jobId_candidateId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JobCandidateMatch_jobId_candidateId_key" ON public."JobCandidateMatch" USING btree ("jobId", "candidateId");


--
-- Name: JobCandidateMatch_jobId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobCandidateMatch_jobId_idx" ON public."JobCandidateMatch" USING btree ("jobId");


--
-- Name: JobCandidateMatch_notificationsSent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobCandidateMatch_notificationsSent_idx" ON public."JobCandidateMatch" USING btree ("notificationsSent");


--
-- Name: JobPost_applicationDeadline_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_applicationDeadline_idx" ON public."JobPost" USING btree ("applicationDeadline");


--
-- Name: JobPost_companyId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_companyId_createdAt_idx" ON public."JobPost" USING btree ("companyId", "createdAt");


--
-- Name: JobPost_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_companyId_idx" ON public."JobPost" USING btree ("companyId");


--
-- Name: JobPost_companyId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_companyId_status_idx" ON public."JobPost" USING btree ("companyId", status);


--
-- Name: JobPost_educationRequired_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_educationRequired_idx" ON public."JobPost" USING btree ("educationRequired");


--
-- Name: JobPost_experienceLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_experienceLevel_idx" ON public."JobPost" USING btree ("experienceLevel");


--
-- Name: JobPost_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_expiresAt_idx" ON public."JobPost" USING btree ("expiresAt");


--
-- Name: JobPost_functionalArea_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_functionalArea_idx" ON public."JobPost" USING btree ("functionalArea");


--
-- Name: JobPost_industry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_industry_idx" ON public."JobPost" USING btree (industry);


--
-- Name: JobPost_isConfidential_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_isConfidential_idx" ON public."JobPost" USING btree ("isConfidential");


--
-- Name: JobPost_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_isFeatured_idx" ON public."JobPost" USING btree ("isFeatured");


--
-- Name: JobPost_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_latitude_longitude_idx" ON public."JobPost" USING btree (latitude, longitude);


--
-- Name: JobPost_location_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_location_idx" ON public."JobPost" USING btree (location);


--
-- Name: JobPost_postingVisibility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_postingVisibility_idx" ON public."JobPost" USING btree ("postingVisibility");


--
-- Name: JobPost_referenceCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_referenceCode_idx" ON public."JobPost" USING btree ("referenceCode");


--
-- Name: JobPost_scheduledPublishAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_scheduledPublishAt_idx" ON public."JobPost" USING btree ("scheduledPublishAt");


--
-- Name: JobPost_shiftType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_shiftType_idx" ON public."JobPost" USING btree ("shiftType");


--
-- Name: JobPost_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_createdAt_idx" ON public."JobPost" USING btree (status, "createdAt");


--
-- Name: JobPost_status_experienceLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_experienceLevel_idx" ON public."JobPost" USING btree (status, "experienceLevel");


--
-- Name: JobPost_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_expiresAt_idx" ON public."JobPost" USING btree (status, "expiresAt");


--
-- Name: JobPost_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_idx" ON public."JobPost" USING btree (status);


--
-- Name: JobPost_status_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_type_idx" ON public."JobPost" USING btree (status, type);


--
-- Name: JobPost_status_workMode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_status_workMode_idx" ON public."JobPost" USING btree (status, "workMode");


--
-- Name: JobPost_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_title_idx" ON public."JobPost" USING btree (title);


--
-- Name: JobPost_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_type_idx" ON public."JobPost" USING btree (type);


--
-- Name: JobPost_urgencyLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_urgencyLevel_idx" ON public."JobPost" USING btree ("urgencyLevel");


--
-- Name: JobPost_workMode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobPost_workMode_idx" ON public."JobPost" USING btree ("workMode");


--
-- Name: JobTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobTemplate_companyId_idx" ON public."JobTemplate" USING btree ("companyId");


--
-- Name: JobTemplate_companyId_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JobTemplate_companyId_name_idx" ON public."JobTemplate" USING btree ("companyId", name);


--
-- Name: KnownDevice_userId_fingerprint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "KnownDevice_userId_fingerprint_key" ON public."KnownDevice" USING btree ("userId", fingerprint);


--
-- Name: KnownDevice_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "KnownDevice_userId_idx" ON public."KnownDevice" USING btree ("userId");


--
-- Name: LoginLocation_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoginLocation_createdAt_idx" ON public."LoginLocation" USING btree ("createdAt");


--
-- Name: LoginLocation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoginLocation_userId_idx" ON public."LoginLocation" USING btree ("userId");


--
-- Name: MfaTrustedDevice_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MfaTrustedDevice_expiresAt_idx" ON public."MfaTrustedDevice" USING btree ("expiresAt");


--
-- Name: MfaTrustedDevice_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MfaTrustedDevice_tokenHash_key" ON public."MfaTrustedDevice" USING btree ("tokenHash");


--
-- Name: MfaTrustedDevice_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MfaTrustedDevice_userId_idx" ON public."MfaTrustedDevice" USING btree ("userId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_createdAt_idx" ON public."Notification" USING btree ("userId", "createdAt");


--
-- Name: Notification_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON public."Notification" USING btree ("userId", "isRead", "createdAt");


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_isRead_idx" ON public."Notification" USING btree ("userId", "isRead");


--
-- Name: ProfileView_profileUserId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileView_profileUserId_createdAt_idx" ON public."ProfileView" USING btree ("profileUserId", "createdAt");


--
-- Name: ProfileView_viewerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileView_viewerId_idx" ON public."ProfileView" USING btree ("viewerId");


--
-- Name: PushSubscription_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON public."PushSubscription" USING btree (endpoint);


--
-- Name: PushSubscription_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PushSubscription_userId_idx" ON public."PushSubscription" USING btree ("userId");


--
-- Name: RefreshToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_expiresAt_idx" ON public."RefreshToken" USING btree ("expiresAt");


--
-- Name: RefreshToken_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_sessionId_idx" ON public."RefreshToken" USING btree ("sessionId");


--
-- Name: RefreshToken_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_token_idx" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: SavedCandidate_candidateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedCandidate_candidateId_idx" ON public."SavedCandidate" USING btree ("candidateId");


--
-- Name: SavedCandidate_employerId_candidateId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SavedCandidate_employerId_candidateId_key" ON public."SavedCandidate" USING btree ("employerId", "candidateId");


--
-- Name: SavedCandidate_employerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedCandidate_employerId_idx" ON public."SavedCandidate" USING btree ("employerId");


--
-- Name: SavedJob_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedJob_userId_idx" ON public."SavedJob" USING btree ("userId");


--
-- Name: SavedJob_userId_jobId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON public."SavedJob" USING btree ("userId", "jobId");


--
-- Name: SavedSearch_userId_searchType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedSearch_userId_searchType_idx" ON public."SavedSearch" USING btree ("userId", "searchType");


--
-- Name: ScreeningAnswer_applicationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScreeningAnswer_applicationId_idx" ON public."ScreeningAnswer" USING btree ("applicationId");


--
-- Name: ScreeningAnswer_applicationId_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ScreeningAnswer_applicationId_questionId_key" ON public."ScreeningAnswer" USING btree ("applicationId", "questionId");


--
-- Name: ScreeningAnswer_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScreeningAnswer_questionId_idx" ON public."ScreeningAnswer" USING btree ("questionId");


--
-- Name: ScreeningQuestion_jobId_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScreeningQuestion_jobId_displayOrder_idx" ON public."ScreeningQuestion" USING btree ("jobId", "displayOrder");


--
-- Name: ScreeningQuestion_jobId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScreeningQuestion_jobId_idx" ON public."ScreeningQuestion" USING btree ("jobId");


--
-- Name: Session_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_isActive_idx" ON public."Session" USING btree ("isActive");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Session_userId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_userId_isActive_idx" ON public."Session" USING btree ("userId", "isActive");


--
-- Name: SupportTicket_assignedToId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_assignedToId_idx" ON public."SupportTicket" USING btree ("assignedToId");


--
-- Name: SupportTicket_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_category_idx" ON public."SupportTicket" USING btree (category);


--
-- Name: SupportTicket_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_createdAt_idx" ON public."SupportTicket" USING btree ("createdAt");


--
-- Name: SupportTicket_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_status_idx" ON public."SupportTicket" USING btree (status);


--
-- Name: SupportTicket_ticketNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_ticketNumber_idx" ON public."SupportTicket" USING btree ("ticketNumber");


--
-- Name: SupportTicket_ticketNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON public."SupportTicket" USING btree ("ticketNumber");


--
-- Name: SupportTicket_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportTicket_userId_idx" ON public."SupportTicket" USING btree ("userId");


--
-- Name: SystemConfig_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SystemConfig_key_key" ON public."SystemConfig" USING btree (key);


--
-- Name: TicketMessage_ticketId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON public."TicketMessage" USING btree ("ticketId", "createdAt");


--
-- Name: UserConsent_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserConsent_type_idx" ON public."UserConsent" USING btree (type);


--
-- Name: UserConsent_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserConsent_userId_idx" ON public."UserConsent" USING btree ("userId");


--
-- Name: User_emailVerificationToken_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_emailVerificationToken_idx" ON public."User" USING btree ("emailVerificationToken");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: User_linkedinId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_linkedinId_key" ON public."User" USING btree ("linkedinId");


--
-- Name: User_mobileNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_mobileNumber_key" ON public."User" USING btree ("mobileNumber");


--
-- Name: User_passwordResetToken_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_passwordResetToken_idx" ON public."User" USING btree ("passwordResetToken");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: VerificationRequest_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationRequest_priority_idx" ON public."VerificationRequest" USING btree (priority);


--
-- Name: VerificationRequest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationRequest_status_idx" ON public."VerificationRequest" USING btree (status);


--
-- Name: VerificationRequest_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationRequest_type_idx" ON public."VerificationRequest" USING btree (type);


--
-- Name: VerificationRequest_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationRequest_type_status_idx" ON public."VerificationRequest" USING btree (type, status);


--
-- Name: VerificationRequest_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationRequest_userId_idx" ON public."VerificationRequest" USING btree ("userId");


--
-- Name: WebAuthnCredential_credentialId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON public."WebAuthnCredential" USING btree ("credentialId");


--
-- Name: WebAuthnCredential_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebAuthnCredential_userId_idx" ON public."WebAuthnCredential" USING btree ("userId");


--
-- Name: WebhookDelivery_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookDelivery_createdAt_idx" ON public."WebhookDelivery" USING btree ("createdAt");


--
-- Name: WebhookDelivery_webhookId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookDelivery_webhookId_idx" ON public."WebhookDelivery" USING btree ("webhookId");


--
-- Name: WebhookEndpoint_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookEndpoint_isActive_idx" ON public."WebhookEndpoint" USING btree ("isActive");


--
-- Name: WebhookEndpoint_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookEndpoint_userId_idx" ON public."WebhookEndpoint" USING btree ("userId");


--
-- Name: AuditLog AuditLog_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CandidateListMember CandidateListMember_addedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateListMember"
    ADD CONSTRAINT "CandidateListMember_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CandidateListMember CandidateListMember_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateListMember"
    ADD CONSTRAINT "CandidateListMember_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CandidateListMember CandidateListMember_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateListMember"
    ADD CONSTRAINT "CandidateListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES public."CandidateList"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CandidateList CandidateList_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateList"
    ADD CONSTRAINT "CandidateList_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CandidateProfile CandidateProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandidateProfile"
    ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CompanyProfile CompanyProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyProfile"
    ADD CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeviceToken DeviceToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceToken"
    ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DismissedRecommendation DismissedRecommendation_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DismissedRecommendation"
    ADD CONSTRAINT "DismissedRecommendation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DismissedRecommendation DismissedRecommendation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DismissedRecommendation"
    ADD CONSTRAINT "DismissedRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormDraft FormDraft_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormDraft"
    ADD CONSTRAINT "FormDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobAlert JobAlert_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobAlert"
    ADD CONSTRAINT "JobAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobApplication JobApplication_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."CandidateProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobApplication JobApplication_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobCandidateMatch JobCandidateMatch_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobCandidateMatch"
    ADD CONSTRAINT "JobCandidateMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobCandidateMatch JobCandidateMatch_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobCandidateMatch"
    ADD CONSTRAINT "JobCandidateMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobPost JobPost_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobPost"
    ADD CONSTRAINT "JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."CompanyProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobTemplate JobTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JobTemplate"
    ADD CONSTRAINT "JobTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."CompanyProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: KnownDevice KnownDevice_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnownDevice"
    ADD CONSTRAINT "KnownDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoginLocation LoginLocation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoginLocation"
    ADD CONSTRAINT "LoginLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MfaTrustedDevice MfaTrustedDevice_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MfaTrustedDevice"
    ADD CONSTRAINT "MfaTrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileView ProfileView_profileUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileView"
    ADD CONSTRAINT "ProfileView_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileView ProfileView_viewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileView"
    ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PushSubscription PushSubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedCandidate SavedCandidate_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCandidate"
    ADD CONSTRAINT "SavedCandidate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedCandidate SavedCandidate_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCandidate"
    ADD CONSTRAINT "SavedCandidate_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedJob SavedJob_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedJob SavedJob_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedSearch SavedSearch_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScreeningAnswer ScreeningAnswer_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreeningAnswer"
    ADD CONSTRAINT "ScreeningAnswer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."JobApplication"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScreeningAnswer ScreeningAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreeningAnswer"
    ADD CONSTRAINT "ScreeningAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."ScreeningQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScreeningQuestion ScreeningQuestion_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreeningQuestion"
    ADD CONSTRAINT "ScreeningQuestion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportTicket SupportTicket_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupportTicket SupportTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketMessage TicketMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConsent UserConsent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VerificationRequest VerificationRequest_reviewedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationRequest"
    ADD CONSTRAINT "VerificationRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VerificationRequest VerificationRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationRequest"
    ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WebAuthnCredential WebAuthnCredential_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebAuthnCredential"
    ADD CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WebhookDelivery WebhookDelivery_webhookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebhookDelivery"
    ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES public."WebhookEndpoint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WebhookEndpoint WebhookEndpoint_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebhookEndpoint"
    ADD CONSTRAINT "WebhookEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LpLpdu1h6RnzgydLtnUTtqGGhTxk42EOK7l8orpQXKlv43Jrgg9lVj8kGSQrrvi

