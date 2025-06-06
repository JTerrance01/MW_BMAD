# Epic 13: Competition Creation - Multi-track Zip Upload

## Description

This epic introduces the capability for administrators to upload a zip file containing the multi-tracks and accompanying files when creating a new competition. This zip file serves as the source material that participants will download for mixing. The system needs to store this file securely using the existing file storage mechanism and associate its location (file path or URL) with the competition record in the database.

This epic addresses a missing piece in the competition creation process identified during the validation against the Tourna-Mix rules, which require the availability of raw multi-tracks.

## Functional Requirements Addressed

* Administrators can upload a zip file when creating a competition.
* The uploaded zip file contains the raw multi-track data for participants.
* The system stores the uploaded zip file securely.
* The location of the multi-track zip file is linked to the competition record.
* Participants can download the multi-track zip file from the competition details page (UI task for later, but backend support is needed).

## Technical Approach

We will modify the existing `Competition` entity and the `CreateCompetitionCommand` to accommodate the uploaded file. The file will be handled as an `IFormFile` at the API layer, passed to the Application layer, and then saved using the existing `IFileStorageService`. The path or identifier returned by the storage service will be persisted in the `Competition` entity. Validation will be added to ensure the uploaded file meets basic criteria (e.g., is a zip, size limits).

### Key Technical Tasks & Components

1.  **`Competition` Entity Update:** Add a new property to store the file path or identifier of the uploaded multi-track zip file.
2.  **`CreateCompetitionCommand` Update:** Modify the command to include a property to accept the uploaded file data (e.g., `IFormFile` or a representation of it).
3.  **Validation:** Add validation rules in `CreateCompetitionCommandValidator` for the uploaded file, including checking the file extension (.zip) and potentially size constraints. Consider adding a virus scan check if not already part of the general file upload process.
4.  **`CreateCompetitionCommandHandler` Update:**
    * Receive the uploaded file data from the command.
    * Use the injected `IFileStorageService` to save the file to the configured storage (e.g., S3). Define a clear naming convention and storage path for multi-track zip files (e.g., `competitions/{CompetitionId}/multitracks.zip`).
    * Get the resulting file path or URL from the storage service.
    * Assign this path/URL to the new property on the `Competition` entity before saving the entity to the database.
    * Handle potential file upload or storage errors.
5.  **API Controller Update (`CompetitionsController`):**
    * Modify the `CreateCompetition` endpoint to accept the multi-track zip file as part of the request payload (e.g., using `[FromForm]` to handle file uploads).
    * Pass the received `IFormFile` to the `CreateCompetitionCommand`.
6.  **Frontend Development (Admin UI):**
    * Update the "Create Competition" form to include a file input field for uploading the multi-track zip.
    * Implement client-side validation (optional but recommended for user experience).
    * Configure the form submission to correctly send the file data to the backend API.

## User Stories

* **Story 13.1: As a system architect, I want to update the `Competition` entity and database schema to include a field for storing the path or URL of the multi-track zip file.**
    * _Description:_ Add a new string property (e.g., `MultitrackZipUrl`) to the `Competition` entity in `MixWarz.Domain`. Create a database migration to add this column to the `Competitions` table.
    * _Acceptance Criteria:_
        * `Competition` entity includes a `string? MultitrackZipUrl` property.
        * A database migration is generated and applied to add the `MultitrackZipUrl` column to the `Competitions` table.
* **Story 13.2: As a system architect, I want to update the `CreateCompetitionCommand` to include a property that can receive the uploaded multi-track zip file.**
    * _Description:_ Add a property to the `CreateCompetitionCommand` in `MixWarz.Application` to hold the uploaded file data. This will likely be `IFormFile` or a similar abstraction if used throughout the Application layer.
    * _Acceptance Criteria:_
        * `CreateCompetitionCommand` includes a property of a suitable type (e.g., `IFormFile` or `Stream` with file metadata) to represent the uploaded zip file.
* **Story 13.3: As a system, I want to validate the uploaded multi-track file to ensure it is a zip file and meets basic size requirements before it is saved.**
    * _Description:_ Add validation rules to `CreateCompetitionCommandValidator` to check the uploaded file's content type (for `.zip`), file extension (`.zip`), and file size (define a reasonable maximum size).
    * _Acceptance Criteria:_
        * `CreateCompetitionCommandValidator` includes rules for file type (.zip), extension, and maximum size validation for the multi-track file property.
        * Invalid file uploads are rejected with appropriate validation errors.
* **Story 13.4: As a system, when a competition is created with an uploaded multi-track zip, I want to save the file using the file storage service and store its location in the competition record.**
    * _Description:_ Modify the `CreateCompetitionCommandHandler` to:
        * Receive the uploaded file data from the command.
        * Inject and use the `IFileStorageService` to save the file to a designated location (e.g., `competitions/{CompetitionId}/multitracks.zip`).
        * Ensure the file storage service returns the accessible path or URL.
        * Assign the returned path/URL to the `MultitrackZipUrl` property of the `Competition` entity before saving the entity to the database.
        * Include basic error handling for file storage operations.
    * _Acceptance Criteria:_
        * `CreateCompetitionCommandHandler` correctly uses `IFileStorageService` to save the uploaded file.
        * The returned file path/URL is persisted in the `Competition.MultitrackZipUrl` field.
        * The handler manages potential file storage errors gracefully.
* **Story 13.5: As an administrator, I want to be able to upload the multi-track zip file when creating a new competition via the API.**
    * _Description:_ Update the `CreateCompetition` endpoint in `CompetitionsController` to accept the multi-track file as part of a multipart form request. Ensure the API correctly binds the uploaded file to the `CreateCompetitionCommand`.
    * _Acceptance Criteria:_
        * The `POST /api/competitions` endpoint is updated to accept a file upload along with other competition data.
        * The uploaded file is correctly bound to the `CreateCompetitionCommand` parameter.
* **Story 13.6: As an administrator, I want the "Create Competition" form in the admin user interface to include a file upload field for the multi-track zip file.**
    * _Description:_ (Frontend Task) Update the administrator's interface for creating competitions to include a file input element. Implement client-side logic to handle file selection and prepare the data for submission to the backend API endpoint (likely as a multipart form submission).
    * _Acceptance Criteria:_
        * The "Create Competition" form includes a file input field.
        * The form is configured to submit the file and other competition data correctly to the backend.
        * (Optional) Basic client-side file type and size validation is implemented.