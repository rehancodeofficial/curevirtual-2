# RBAC Testing and Followup Plan

## Overview
This document outlines the comprehensive testing plan for the RBAC implementation across messages.js, subscription.js, and videocall.js routes, plus followup steps to ensure consistent RBAC application across the entire backend.

## Testing Phase

### 1. Authentication Enforcement Testing
**Objective**: Verify that all updated routes properly enforce authentication

#### Test Cases for messages.js:
- [ ] `GET /api/messages/contacts/all` - Should require authentication
- [ ] `GET /api/messages/unread-count?userId=UUID` - Should require authentication
- [ ] `POST /api/messages/mark-read` - Should require authentication
- [ ] `PATCH /api/messages/:id/read` - Should require authentication
- [ ] `GET /api/messages/:folder` - Should require authentication
- [ ] `GET /api/messages/:folder/:page` - Should require authentication
- [ ] `POST /api/messages/send` - Should require authentication

#### Test Cases for subscription.js:
- [ ] `GET /api/subscription/subscription/prices` - Should require authentication
- [ ] `GET /api/subscription/subscription/status?userId=UUID` - Should require authentication
- [ ] `GET /api/subscription/subscription?userId=UUID` - Should require authentication
- [ ] `GET /api/subscription/subscription/history` - Should require authentication

#### Test Cases for videocall.js:
- [ ] `POST /api/videocall/create` - Should require authentication
- [ ] `GET /api/videocall/list?userId=...&role=...` - Should require authentication
- [ ] `POST /api/videocall/token` - Should require authentication
- [ ] `PUT /api/videocall/status/:id` - Should require authentication
- [ ] `PATCH /api/videocall/reschedule/:id` - Should require authentication

### 2. Role-Based Access Control Testing
**Objective**: Verify that role restrictions work correctly

#### Admin-Only Route Tests:
- [ ] `PUT /api/subscription/subscription/prices` - Should only allow ADMIN/SUPERADMIN
- [ ] `PATCH /api/subscription/subscription/:id/status` - Should only allow ADMIN/SUPERADMIN
- [ ] `GET /api/subscription/stats` - Should only allow ADMIN/SUPERADMIN

#### Broadcast Message Tests:
- [ ] `POST /api/messages/send` with `broadcast: true` - Should only allow ADMIN/SUPERADMIN
- [ ] `POST /api/messages/send` with `recipient: "ALL"` - Should only allow ADMIN/SUPERADMIN

#### Regular User Route Tests:
- [ ] User routes should work for authenticated users with appropriate roles
- [ ] Users should not be able to access admin-only functionality

### 3. Frontend Compatibility Testing
**Objective**: Ensure frontend works with new authentication requirements

#### API Calls to Test:
- [ ] Messages API calls from frontend components
- [ ] Subscription API calls from user dashboards
- [ ] Video call API calls from consultation interfaces

#### Authentication Flow Testing:
- [ ] Token-based authentication from frontend
- [ ] Proper error handling for 401/403 responses
- [ ] Frontend redirect behavior for unauthorized access

## Followup Phase

### 4. Review Other Route Files
**Objective**: Identify and fix similar RBAC gaps in other route files

#### Route Files to Review:
- [ ] `adminDashboard.js` - Check admin-only access
- [ ] `adminRoutes.js` - Verify admin permissions
- [ ] `admins.js` - Ensure admin management is properly secured
- [ ] `adminUsers.js` - Check user management permissions
- [ ] `adminSubscription.js` - Verify subscription management access
- [ ] `doctor.js` - Check doctor-specific routes
- [ ] `doctorPatients.js` - Verify doctor-patient relationship access
- [ ] `doctorVideo.js` - Check doctor video call permissions
- [ ] `patientRoutes.js` - Verify patient-specific routes
- [ ] `patientDoctors.js` - Check patient-doctor relationship access
- [ ] `pharmacy.js` - Verify pharmacy permissions
- [ ] `user.js` - Check general user routes
- [ ] `superadmin.js` - Verify superadmin-only access
- [ ] `support.js` - Check support ticket permissions
- [ ] `twilioToken.js` - Verify video token generation security

### 5. Consistency Check
**Objective**: Ensure consistent RBAC application across the entire backend

#### Check Points:
- [ ] All route files import RBAC middleware
- [ ] All protected routes use appropriate middleware
- [ ] Role restrictions are consistently applied
- [ ] Error handling is uniform across all routes
- [ ] Documentation reflects current RBAC implementation

### 6. Documentation Updates
**Objective**: Update API documentation to reflect new security requirements

#### Documentation Tasks:
- [ ] Update API documentation for modified routes
- [ ] Document authentication requirements
- [ ] Document role-based permissions
- [ ] Update frontend integration guides
- [ ] Create RBAC implementation guide

## Testing Tools and Methods

### 1. Manual API Testing
- Use tools like Postman or curl to test each endpoint
- Test with different user roles (PATIENT, DOCTOR, ADMIN, SUPERADMIN)
- Verify proper 401/403 responses for unauthorized access

### 2. Automated Testing Scripts
- Create test scripts for authentication flows
- Create test scripts for role-based access
- Create integration tests for critical user journeys

### 3. Frontend Testing
- Test all frontend components that use the updated APIs
- Verify error handling and user feedback
- Test authentication flows in the browser

## Success Criteria

### Testing Phase Success:
- [ ] All authentication enforcement tests pass
- [ ] All role-based access control tests pass
- [ ] Frontend compatibility confirmed
- [ ] No security vulnerabilities identified

### Followup Phase Success:
- [ ] All route files reviewed and updated
- [ ] Consistent RBAC implementation across backend
- [ ] Documentation updated and accurate
- [ ] System security significantly improved

## Timeline and Next Steps

1. **Testing Phase** (Estimated: 2-3 hours)
   - Execute all authentication tests
   - Execute all role-based access tests
   - Test frontend compatibility

2. **Review Phase** (Estimated: 3-4 hours)
   - Review remaining route files
   - Identify RBAC gaps
   - Plan updates for each file

3. **Implementation Phase** (Estimated: 4-6 hours)
   - Apply RBAC to identified gaps
   - Test updated routes
   - Ensure consistency

4. **Documentation Phase** (Estimated: 1-2 hours)
   - Update API documentation
   - Create implementation guides
   - Document changes

## Risk Assessment

### High Priority Risks:
- Missing RBAC on critical admin routes
- Frontend breaking due to authentication changes
- Inconsistent error handling across routes

### Mitigation Strategies:
- Comprehensive testing before deployment
- Staged rollout with monitoring
- Fallback mechanisms for critical functions
- Clear rollback procedures

---

**Status**: Ready for implementation
**Next Action**: Begin testing phase execution
