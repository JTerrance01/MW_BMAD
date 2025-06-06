# Epic 13: Multi-track Zip Upload for Competitions

## Overview

This feature allows competition organizers to upload multi-track zip files when creating or editing competitions. These files will be available for participants to download and use for their mix submissions.

## Implemented Features

1. **Backend Changes:**

   - Added `MultitrackZipUrl` property to the `Competition` entity
   - Created migration file `20250517000000_AddMultitrackZipUrlToCompetition.cs` for database updates
   - Enhanced `CreateCompetitionCommand` to handle multitrack zip file uploads
   - Added validation for zip file uploads (file type, size limit)
   - Added `GetFileUrlAsync` utility method to generate time-limited download URLs

2. **Frontend Changes:**

   - Added multitrack zip file upload field to the admin competition creation form
   - Added appropriate form handling for multipart file uploads
   - Added validation and feedback for file uploads
   - Implemented UI indication when a competition has multitrack files

3. **API Endpoints:**
   - Enhanced `POST /api/competitions` to handle multitrack file uploads (as multipart/form-data)
   - Added new `GET /api/competitions/{id}/download-multitrack` endpoint to generate download links

## How to Use

### Uploading Multi-track Files (Admin)

1. Navigate to the Competition Management page in the Admin dashboard
2. Click "New Competition" or edit an existing competition
3. Fill out the competition details
4. In the "Multi-track ZIP File" section, click to select a ZIP file (max 100MB)
5. Complete and submit the form

### Downloading Multi-track Files (Participants)

1. Navigate to a competition page
2. If the competition has multitrack files available, a download button will be visible
3. Click the download button to get the multitrack files
4. Use these files for your mix submission

## Technical Notes

- Multitrack files are stored in a dedicated `competition-multitracks` directory
- Files are limited to 100MB maximum size
- Only ZIP files are accepted (.zip extension)
- Download links are secured and expire after 15 minutes
- The backend validates file type and size before storage
