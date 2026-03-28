# STORY-505: Consolidate API Clients - Unify localStorage Keys

**Phase**: Phase 5+
**Assignee**: @dev
**Story Points**: 5
**Priority**: LOW
**Status**: Ready for Development
**Gate**: Tracked as LOW-003 in Phase 4 QA Review

---

## Summary

Two separate API clients with different localStorage keys cause confusion and potential sync issues:
- `api.js` stores token in `localStorage.getItem('token')`
- `sourcingAPI.js` stores token in `localStorage.getItem('sourcingToken')`

Phase 5+ needs single, consolidated client for all API operations.

## Acceptance Criteria

- [ ] **AC-1**: Single API client `apiClient.js` with unified methods
- [ ] **AC-2**: Token stored in single localStorage key
- [ ] **AC-3**: All frontend imports updated to use new client
- [ ] **AC-4**: Timeout handling consistent across all requests
- [ ] **AC-5**: Tests pass without duplicated client code

## Tasks

### Task 1: Create unified apiClient.js
```javascript
// src/frontend/apiClient.js
class APIClient {
  constructor(baseURL, timeout = 5000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(...)
      // ...
    } finally {
      clearTimeout(id);
    }
  }

  async listVehicles(limit, offset) { /* ... */ }
  async searchVehicles(filters) { /* ... */ }
  async markInterested(vehicleId, note) { /* ... */ }
}
```

**Location**: `src/frontend/apiClient.js` (new)
**Effort**: 1 hour

### Task 2: Migrate App.jsx to use new client
- Remove old api.js imports
- Replace all API calls with unified client
- Update state management if needed

**Location**: `src/frontend/App.jsx`
**Effort**: 1.5 hours

### Task 3: Migrate SourcingList.jsx
- Remove sourcingAPI.js import
- Use unified client
- Verify filters and pagination still work

**Location**: `src/frontend/SourcingList.jsx`
**Effort**: 30 min

### Task 4: Remove old client files (cleanup)
- Delete `src/frontend/api.js`
- Delete `src/frontend/sourcingAPI.js`
- Update any other imports

**Effort**: 15 min

### Task 5: Tests - verify all endpoints still work
- Ensure token handling works
- Timeout behavior consistent
- Error handling unified

**Effort**: 1 hour

## Dependencies

- No backend changes required
- Frontend-only refactoring
- Non-breaking if done carefully

## Definition of Done

✅ Single API client in use
✅ No duplicate client code
✅ All imports updated
✅ Tests passing
✅ localStorage key unified

## Notes

- Maintain backward compatibility during transition (optional)
- Consider environment-based configuration for API_URL
- Add request interceptors for future auth flows
- Opportunity to add logging/tracing

---

**Created By**: @aios-master (Orion)
**Date**: 2026-03-28
**Target Phase**: Phase 5+
