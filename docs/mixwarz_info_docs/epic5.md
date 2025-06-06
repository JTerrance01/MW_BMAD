# Epic 5: Enhanced User Profiles & Media

**Goal:** Implement functionality for users to personalize their profiles by uploading and managing profile pictures, a bio, a gallery of images, and a portfolio of audio files, enabling them to showcase their visual identity and audio work. This directly supports the PRD objective of providing users with enhanced profiles.

## Story List

### Story 5.1: Extend User Model for Profile Data & Media References

-   **User Story / Goal:** As a Backend Developer, I want to extend the `User` entity and related database schema to include attributes for a profile picture URL, bio, and references for gallery images and audio files, so the system can store this enhanced profile information.
-   **Detailed Requirements:**
    -   Extend the `User` entity (`MixWarz.Domain/Entities/User.cs`) to include:
        -   `string? ProfilePictureUrl { get; set; }` (for S3 key/URL)
        -   `string? Bio { get; set; }` (e.g., max 500 characters)
    -   Define a new `UserProfileGalleryImage` entity (`MixWarz.Domain/Entities/UserProfileGalleryImage.cs`):
        -   Attributes: `UserProfileGalleryImageId` (PK), `UserId` (FK to User), `ImageUrl` (string, S3 key/URL), `UploadedAt` (DateTime).
        -   Constraint: Max 5 gallery images per user (to be enforced by application logic).
    -   Define a new `UserProfileAudioFile` entity (`MixWarz.Domain/Entities/UserProfileAudioFile.cs`):
        -   Attributes: `UserProfileAudioFileId` (PK), `UserId` (FK to User), `AudioFileUrl` (string, S3 key/URL), `Title` (string, nullable, e.g., max 100 chars), `Description` (string, nullable, e.g., max 300 chars), `UploadedAt` (DateTime).
        -   Constraint: Max 5 audio files per user (to be enforced by application logic).
    -   Update `ApplicationDbContext.cs` in `MixWarz.Infrastructure` to include these new entities and configure their relationships (one-to-many from User to gallery images and audio files).
    -   Generate and apply EF Core migrations to update the database schema.
    -   Update `docs/data-models.md` to reflect these changes.
-   **Acceptance Criteria (ACs):**
    -   AC1: `User` entity includes `ProfilePictureUrl` and `Bio`.
    -   AC2: `UserProfileGalleryImage` and `UserProfileAudioFile` entities are defined with specified attributes and foreign keys.
    -   AC3: `ApplicationDbContext` is updated with new `DbSet`s and relationships.
    -   AC4: EF Core migration is successfully generated and applied.
    -   AC5: `docs/data-models.md` is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Define `UserProfileGalleryImage` entity.
    -   [ ] Define `UserProfileAudioFile` entity.
    -   [ ] Modify `User` entity.
    -   [ ] Update `AppDbContext` and configure relationships.
    -   [ ] Generate EF Core migration.
    -   [ ] Apply migration locally.
    -   [ ] Update `docs/data-models.md`.

---

### Story 5.2: Profile Picture Upload & Management API & UI

-   **User Story / Goal:** As an Authenticated User, I want to upload, update, or remove my primary profile picture, so I can control my visual representation on the platform.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create protected RESTful endpoints (e.g., `PUT /api/v1/users/me/profile-picture`, `DELETE /api/v1/users/me/profile-picture`).
        -   `PUT`: Accepts image file (JPEG, PNG, max 2MB). Validates type/size. Performs virus scan. Uploads valid file to AWS S3 (e.g., `user-profiles/pictures/{userId}/profile_{timestamp}.ext`). Updates `User.ProfilePictureUrl`. Handles replacement (deletes old S3 object or versions).
        -   `DELETE`: Clears `User.ProfilePictureUrl` and deletes the corresponding S3 object.
    -   **Frontend (React):**
        -   On user's profile settings page: UI to upload/change/remove profile picture.
        -   Client-side validation (type, size). Display upload progress and feedback.
    -   Update `docs/api-reference.md` and relevant sections of `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully upload a valid profile picture; it's scanned, stored in S3, and `User.ProfilePictureUrl` is updated.
    -   AC2: User can remove their profile picture; `User.ProfilePictureUrl` is cleared, and S3 object is deleted.
    -   AC3: API rejects invalid files (type, size, virus) with appropriate errors.
    -   AC4: Frontend UI facilitates profile picture upload and removal with feedback.
    -   AC5: Documentation (`api-reference.md`, `ui-ux-spec.md`) is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Implement S3 service for profile picture (upload, delete).
    -   [ ] Backend: Integrate virus scanning for uploads.
    -   [ ] Backend: Develop `UpdateProfilePictureCommand` and `DeleteProfilePictureCommand` handlers.
    -   [ ] Backend: Implement API endpoints in `UserProfileController` (or similar).
    -   [ ] Frontend: Create `ProfilePictureUpload.tsx` component.
    -   [ ] Frontend: Integrate component into profile settings page.
    -   [ ] Update documentation.

---

### Story 5.3: User Bio Update API & UI

-   **User Story / Goal:** As an Authenticated User, I want to add or update my bio (a short text description about myself), so I can provide more context on my profile.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `PUT /api/v1/users/me/bio` or as part of a general profile update endpoint).
        -   Accepts a text string for the bio (e.g., max 500 characters).
        -   Validate length.
        -   Update `User.Bio` in the database for the authenticated user.
    -   **Frontend (React):**
        -   On user's profile settings page: A textarea input for the bio.
        -   Client-side validation (max length). Save button.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully update their bio via API and UI.
    -   AC2: API validates bio length and returns error if exceeded.
    -   AC3: Frontend UI allows bio input and reflects saved changes.
    -   AC4: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Develop `UpdateUserBioCommand` handler.
    -   [ ] Backend: Implement API endpoint for bio update.
    -   [ ] Frontend: Add bio input field and save functionality to profile settings page.
    -   [ ] Update documentation.

---

### Story 5.4: Profile Image Gallery Management API & UI

-   **User Story / Goal:** As an Authenticated User, I want to upload and manage a gallery of up to 5 additional images on my profile, so I can showcase more of my visual work or brand.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   `POST /api/v1/users/me/gallery-images`: Upload a new gallery image. Validates (type, size up to 2MB, virus scan), checks user's current gallery count (max 5). Uploads to S3 (e.g., `user-profiles/gallery/{userId}/{timestamp}_{filename}.ext`). Creates `UserProfileGalleryImage` record.
        -   `DELETE /api/v1/users/me/gallery-images/{galleryImageId}`: Delete a specific gallery image. Verifies ownership. Deletes S3 object and `UserProfileGalleryImage` record.
    -   **Frontend (React):**
        -   In profile settings: UI to upload new gallery images, view thumbnails of existing ones, and delete them.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can upload up to 5 gallery images; files are validated, scanned, stored in S3, and recorded.
    -   AC2: API prevents uploading more than 5 gallery images per user.
    -   AC3: User can delete their gallery images; S3 object and DB record are removed.
    -   AC4: Frontend UI enables gallery image upload, display (thumbnails), and deletion.
    -   AC5: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Implement S3 service for gallery images.
    -   [ ] Backend: Integrate virus scanning.
    -   [ ] Backend: Develop `UploadGalleryImageCommand` and `DeleteGalleryImageCommand` handlers.
    -   [ ] Backend: Implement API endpoints for gallery management.
    -   [ ] Frontend: Create `GalleryImageManagement.tsx` component.
    -   [ ] Frontend: Integrate into profile settings page.
    -   [ ] Update documentation.

---

### Story 5.5: Profile Audio Portfolio Management API & UI

-   **User Story / Goal:** As an Authenticated User, I want to upload and manage a portfolio of up to 5 audio files (e.g., MP3, WAV, with titles/descriptions) on my profile, so I can showcase my audio work.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   `POST /api/v1/users/me/audio-files`: Upload new audio file. Accepts file (MP3/WAV, e.g., max 10MB), title, description. Validates (type, size, virus scan), checks count (max 5). Uploads to S3 (e.g., `user-profiles/audio/{userId}/{timestamp}_{filename}.ext`). Creates `UserProfileAudioFile` record with metadata.
        -   `PUT /api/v1/users/me/audio-files/{audioFileId}`: Update title/description of an existing audio file. Verifies ownership.
        -   `DELETE /api/v1/users/me/audio-files/{audioFileId}`: Delete an audio file. Verifies ownership. Deletes S3 object and `UserProfileAudioFile` record.
    -   **Frontend (React):**
        -   In profile settings: UI to upload audio files, edit their titles/descriptions, list existing ones (with playback capability), and delete them.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can upload up to 5 audio files with metadata; files are validated, scanned, stored in S3, and recorded.
    -   AC2: API prevents uploading more than 5 audio files.
    -   AC3: User can update metadata (title, description) for their audio files.
    -   AC4: User can delete their audio files; S3 object and DB record are removed.
    -   AC5: Frontend UI supports audio file upload, metadata editing, listing, basic playback, and deletion.
    -   AC6: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Implement S3 service for audio files.
    -   [ ] Backend: Integrate virus scanning.
    -   [ ] Backend: Develop command handlers for audio file CRUD and metadata updates.
    -   [ ] Backend: Implement API endpoints for audio portfolio management.
    -   [ ] Frontend: Create `AudioPortfolioManagement.tsx` component with upload, edit, list, playback.
    -   [ ] Frontend: Integrate into profile settings page.
    -   [ ] Update documentation.

---

### Story 5.6: User Profile Page UI (View Own & Public)

-   **User Story / Goal:** As a User, I want to view my own complete profile page, and as any User (authenticated or not), I want to view other users' public profiles, so that personal and shared information can be displayed.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   `GET /api/v1/users/me/profile`: (Authenticated) Retrieves comprehensive profile data for the current user (username, email from JWT, roles, bio, profile picture URL, gallery image URLs, audio file URLs with metadata).
        -   `GET /api/v1/users/{userIdOrUsername}/profile`: (Public) Retrieves public profile data for a given user (username, bio, profile picture URL, gallery image URLs, audio file URLs with metadata). Excludes sensitive info like email unless explicitly public by user choice (not in MVP).
    -   **Frontend (React):**
        -   Create a `UserProfilePage.tsx` component.
        -   If viewing own profile (e.g., `/profile/me`): display all data, provide edit links to settings sections.
        -   If viewing public profile (e.g., `/profile/{userIdOrUsername}`): display public data. Gallery images displayed (e.g., in a grid/carousel). Audio files listed with titles/descriptions and playable via a basic embedded player.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: Authenticated users can view their own detailed profile via API and UI.
    -   AC2: Any user can view another user's public profile via API and UI, showing username, bio, profile picture, image gallery, and audio portfolio (with playback).
    -   AC3: Frontend page correctly differentiates between own profile view (with edit options) and public view.
    -   AC4: Media (images, audio) is displayed correctly. Audio files are playable.
    -   AC5: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Implement `GET /api/v1/users/me/profile` endpoint and associated query handler.
    -   [ ] Backend: Implement `GET /api/v1/users/{userIdOrUsername}/profile` public endpoint and handler.
    -   [ ] Frontend: Develop `UserProfilePage.tsx` component.
    -   [ ] Frontend: Implement logic to fetch and display own vs. public profile data.
    -   [ ] Frontend: Integrate display for gallery images and audio portfolio (with player).
    -   [ ] Frontend: Set up routing for profile pages.
    -   [ ] Update documentation.

## Change Log

| Change        | Date       | Version | Description                                      | Author         |
| ------------- | ---------- | ------- | ------------------------------------------------ | -------------- |
| Initial Draft | 2025-05-08 | 0.1     | First draft of Epic 5 stories.                   | Product Owner / Scrum Master AI |