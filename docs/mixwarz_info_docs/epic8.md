# Epic 8: Basic Asynchronous Audio Analysis for Music Submissions

**Goal:** Implement an asynchronous background process to perform basic audio analysis (clipping, silence, LUFS) on user-submitted music files. The results will be stored with the submission to aid in pre-filtering or prioritizing manual review.

**Key Technologies:** .NET Background Services or Hangfire, NAudio, FFmpeg (as an external tool).

**Affected Modules/Entities:**
- `MixWarz.Domain/Entities/Submission.cs`
- `MixWarz.Domain/Enums/SubmissionStatus.cs`
- `MixWarz.Application/Features/Submissions/Commands/CreateSubmission/CreateSubmissionCommandHandler.cs`
- `MixWarz.Application/Common/Interfaces/IAudioAnalysisService.cs` (new)
- `MixWarz.Infrastructure/Services/AudioAnalysisService.cs` (new)
- `MixWarz.Infrastructure/Services/S3FileStorageService.cs` (may need download capability)
- `Program.cs` or DI setup for background job framework.

---

## User Stories for Epic 8

---

### Story 8.1: Enhance `Submission` Entity and Enums for Audio Analysis

**As a** system,
**I want to** store the results of audio analysis and track the analysis process for each submission,
**So that** this information can be used for review and display.

**Acceptance Criteria:**

1.  The `MixWarz.Domain/Entities/Submission.cs` entity is updated with the following nullable fields:
    * `public double? LufsValue { get; set; }` (Integrated LUFS)
    * `public bool? DetectedClipping { get; set; }`
    * `public bool? IsSilentTrack { get; set; }` (Or a more descriptive name like `OverallLoudnessBelowThreshold`)
    * `public DateTime? AnalysisDate { get; set; }`
    * `public string? AnalysisNotes { get; set; }` (For storing raw FFmpeg output or other messages)
2.  The `MixWarz.Domain/Enums/SubmissionStatus.cs` enum is updated with new values:
    * `PendingAnalysis` (set after initial upload, before analysis job starts/completes)
    * `AnalysisInProgress` (optional, if you want to mark it during processing)
    * `AnalysisCompleted` (set after successful analysis)
    * `AnalysisFailed` (set if the analysis process encounters an unrecoverable error)
3.  EF Core migrations are created and applied to update the database schema.

**Technical Notes:**

* Ensure all new fields on `Submission.cs` are nullable as analysis might fail or not apply to all file types.

---

### Story 8.2: Setup Background Job Processing Framework (e.g., Hangfire)

**As a** developer,
**I want to** integrate a background job processing framework,
**So that** audio analysis can be performed asynchronously without blocking the user's submission request.

**Acceptance Criteria:**

1.  A background job framework (e.g., Hangfire.AspNetCore, Hangfire.MemoryStorage for development, Hangfire.SqlServer for production) is added as a NuGet package to `MixWarz.API` and `MixWarz.Infrastructure`.
2.  Hangfire (or chosen framework) is configured in `MixWarz.API/Program.cs`:
    * Services are added (e.g., `services.AddHangfire(config => ...)`).
    * Middleware is added (e.g., `app.UseHangfireDashboard()` - optional, `app.UseHangfireServer()`).
3.  A storage mechanism for Hangfire jobs is configured (e.g., MemoryStorage for simplicity in dev, or a persistent store like SQL Server for reliability).
4.  The system can successfully enqueue and process a simple test background job.

**Technical Notes:**

* Hangfire is a good choice for .NET. Alternatives include Quartz.NET or custom `BackgroundService` with a persistent queue (Azure Queues, RabbitMQ).
* The Hangfire dashboard (`/hangfire`) is useful for monitoring jobs. Secure it appropriately.

---

### Story 8.3: Create `IAudioAnalysisService` Interface and Implementation Stub

**As a** developer,
**I want to** define a contract for the audio analysis service and a basic implementation structure,
**So that** it can be integrated into the submission workflow and background job processing.

**Acceptance Criteria:**

1.  An interface `IAudioAnalysisService.cs` is created in `MixWarz.Application/Common/Interfaces/` with a method signature like:
    ```csharp
    public interface IAudioAnalysisService
    {
        Task AnalyzeSubmissionAsync(int submissionId);
    }
    ```
2.  A class `AudioAnalysisService.cs` implementing `IAudioAnalysisService` is created in `MixWarz.Infrastructure/Services/`.
3.  `AudioAnalysisService` constructor injects `IAppDbContext` and `IFileStorageService` (from `MixWarz.Domain.Interfaces`).
4.  The `AnalyzeSubmissionAsync(int submissionId)` method in the stub implementation:
    * Logs that it has been called with the `submissionId`.
    * Retrieves the `Submission` entity using `submissionId`.
    * If submission is not found, logs an error and returns.
    * (Initially) Does not perform actual analysis but can simulate work or log steps.
5.  `IAudioAnalysisService` and its implementation `AudioAnalysisService` are registered for Dependency Injection in `MixWarz.Infrastructure/Extensions/ServiceCollectionExtensions.cs` or `Program.cs`.

**Technical Notes:**

* This sets up the structure before adding the actual audio processing logic.

---

### Story 8.4: Modify Submission Workflow to Enqueue Analysis Job

**As a** system,
**I want to** automatically enqueue an audio analysis job after a new submission is successfully created,
**So that** the analysis process starts without manual intervention.

**Acceptance Criteria:**

1.  In `MixWarz.Application/Features/Submissions/Commands/CreateSubmission/CreateSubmissionCommandHandler.cs`:
    * After the `Submission` entity is successfully saved to the database:
        * The `Submission.Status` is initially set to `SubmissionStatus.PendingAnalysis`.
        * The database changes are saved.
    * A background job is enqueued to call `IAudioAnalysisService.AnalyzeSubmissionAsync(newSubmission.Id)`.
        * Using Hangfire: `BackgroundJob.Enqueue<IAudioAnalysisService>(service => service.AnalyzeSubmissionAsync(newSubmission.Id));`
        * The `IBackgroundJobClient` (from Hangfire) can be injected into the command handler.
2.  The `CreateSubmissionCommand` and its handler complete quickly, returning a response to the user, while the analysis job runs in the background.

**Technical Notes:**

* Ensure the `submissionId` passed to the background job is the persisted ID of the new submission.
* The command handler should not `await` the completion of the background job.

---

### Story 8.5: Implement File Download in `AudioAnalysisService`

**As an** `AudioAnalysisService`,
**I want to** download the submitted audio file from S3 to a temporary local location,
**So that** audio processing libraries can access and analyze it.

**Acceptance Criteria:**

1.  The `MixWarz.Domain.Interfaces.IFileStorageService` interface has, or is updated to have, a method for downloading a file, e.g., `Task DownloadFileAsync(string fileKey, Stream destinationStream)` or `Task<Stream> GetFileStreamAsync(string fileKey)`.
2.  The `MixWarz.Infrastructure.Services.S3FileStorageService` implements this download method correctly.
3.  In `AudioAnalysisService.AnalyzeSubmissionAsync(int submissionId)`:
    * After fetching the `Submission` entity, it retrieves `submission.FileUrl`.
    * It extracts the S3 object key from `FileUrl`.
    * It calls the `IFileStorageService` method to download the S3 object into a temporary local file (e.g., using `Path.GetTempFileName()`).
4.  A `try...finally` block is used to ensure the temporary local file is deleted after analysis is complete or if an error occurs.
5.  The path to the temporary local file is available for subsequent analysis steps.
6.  Error handling is in place for download failures (e.g., file not found in S3). If download fails, `Submission.Status` is set to `AnalysisFailed` with appropriate `AnalysisNotes`.

**Technical Notes:**

* Managing temporary files carefully is important to avoid disk space issues.
* Consider file size limits or streaming if very large files are expected, though downloading fully might be simpler for NAudio/FFmpeg.

---

### Story 8.6: Integrate NAudio for Basic Checks (Clipping, Silence)

**As an** `AudioAnalysisService`,
**I want to** use the NAudio library to perform basic audio checks like clipping and silence detection,
**So that** these potential issues can be flagged on the submission.

**Acceptance Criteria:**

1.  The `NAudio` NuGet package is added to `MixWarz.Infrastructure`.
2.  In `AudioAnalysisService.AnalyzeSubmissionAsync`, after the file is downloaded:
    * The temporary audio file is opened using `NAudio.Wave.AudioFileReader`.
3.  **Clipping Detection:**
    * The service iterates through audio samples.
    * If any sample's absolute value is >= 1.0f (for float samples), `Submission.DetectedClipping` is set to `true`. Otherwise, `false`.
4.  **Silence Detection (Basic):**
    * Calculate the average absolute amplitude of all samples.
    * If the average is below a configurable threshold (e.g., 0.005f, to be tuned), `Submission.IsSilentTrack` is set to `true`. Otherwise, `false`.
    * Alternatively, check for long contiguous segments of silence.
5.  The results (`DetectedClipping`, `IsSilentTrack`) are saved to the `Submission` entity. Any relevant observations can be added to `Submission.AnalysisNotes`.

**Technical Notes:**

* NAudio can handle various formats, but ensure the common uploaded formats (WAV, MP3) are supported.
* Clipping detection by checking for 1.0f is a basic form; true peak detection is more complex.
* Silence detection here is rudimentary. More advanced methods exist but are harder to implement. Define what "silent" means for your context.
* Handle potential exceptions from NAudio (e.g., unsupported file format).

---

### Story 8.7: Integrate FFmpeg for LUFS Calculation

**As an** `AudioAnalysisService`,
**I want to** use FFmpeg to calculate the integrated LUFS (Loudness Units Full Scale) of the audio file,
**So that** a standard loudness measurement can be stored for the submission.

**Acceptance Criteria:**

1.  FFmpeg is installed and accessible in the environment where the `AudioAnalysisService` (background job) runs. (This is an infrastructure prerequisite, e.g., in a Dockerfile or on the server).
2.  In `AudioAnalysisService.AnalyzeSubmissionAsync`, after the file is downloaded:
    * A new process is started to execute `ffmpeg` with appropriate arguments (e.g., `ffmpeg -i temporary_file_path -af ebur128 -f null -`).
    * The standard error (stderr) output from FFmpeg, which contains the ebur128 filter's loudness report, is captured.
3.  The FFmpeg output is parsed to extract the "Integrated loudness" value (e.g., "-23.5 LUFS").
4.  The extracted LUFS value (as a double) is stored in `Submission.LufsValue`.
5.  Relevant parts of the FFmpeg output (or a summary) can be stored in `Submission.AnalysisNotes`.
6.  If FFmpeg execution fails or LUFS value cannot be parsed, this is logged in `AnalysisNotes`, and `Submission.LufsValue` remains null.

**Technical Notes:**

* Executing external processes requires careful handling of paths, arguments, and error streams. Use `System.Diagnostics.Process`.
* FFmpeg path might need to be configurable.
* Parsing FFmpeg output can be fragile; make it as robust as possible. Look for specific lines like `Integrated loudness: I: -XX.X LUFS`.
* This step can be time-consuming for large files.

---

### Story 8.8: Update Submission Status and Finalize Analysis in `AudioAnalysisService`

**As an** `AudioAnalysisService`,
**I want to** update the submission's status upon completion or failure of the analysis and record the analysis date,
**So that** the system reflects the current state of the submission accurately.

**Acceptance Criteria:**

1.  In `AudioAnalysisService.AnalyzeSubmissionAsync`:
    * A `try...catch` block surrounds the entire analysis logic (download, NAudio, FFmpeg).
2.  **On Success:**
    * After all analysis steps are completed (or attempted), `Submission.AnalysisDate` is set to `DateTime.UtcNow`.
    * `Submission.Status` is updated to `SubmissionStatus.AnalysisCompleted`.
    * All changes to the `Submission` entity (LUFS, clipping, silence, notes, date, status) are saved to the database using `IAppDbContext.SaveChangesAsync()`.
3.  **On Failure:**
    * If any part of the analysis process (download, NAudio, FFmpeg, or other unexpected error) throws an exception:
        * The exception is caught and logged.
        * `Submission.Status` is updated to `SubmissionStatus.AnalysisFailed`.
        * Details of the error are appended to `Submission.AnalysisNotes`.
        * `Submission.AnalysisDate` is set to `DateTime.UtcNow`.
        * Changes to the `Submission` entity are saved to the database.
4.  The temporary audio file is deleted in a `finally` block, regardless of success or failure.

**Technical Notes:**

* Ensure database updates are atomic where possible or handled gracefully.
* Clear logging is essential for diagnosing issues with the background analysis.

---

### Story 8.9: (Optional) Admin UI to View Analysis Results

**As an** administrator,
**I want to** view the audio analysis results (LUFS, clipping, silence, notes) for each submission in the admin interface,
**So that** I can use this information to prioritize or assess submissions.

**Acceptance Criteria:**

1.  The admin panel/dashboard where submissions are listed or viewed is updated.
2.  New columns or fields are added to display:
    * `LufsValue`
    * `DetectedClipping` (e.g., as "Yes/No" or an icon)
    * `IsSilentTrack` (e.g., as "Yes/No" or an icon)
    * `AnalysisDate`
    * `AnalysisNotes` (perhaps a snippet or a link/modal to view full notes)
    * `Submission.Status` (which will now include analysis-related statuses).
3.  These fields are populated from the `Submission` entity.
4.  (Stretch) Admins can filter or sort submissions based on these analysis results (e.g., show all submissions with detected clipping).

**Technical Notes:**

* This involves changes to existing Admin queries/DTOs in `MixWarz.Application` (e.g., under `Features/Admin/Queries/GetSubmissionsList` if such a query exists, or wherever submissions are displayed) and the corresponding frontend code for the admin panel.
* This story depends on how the admin interface is built and is marked optional as it might be outside the direct scope of the backend AI agent's immediate tasks but is a logical follow-up.