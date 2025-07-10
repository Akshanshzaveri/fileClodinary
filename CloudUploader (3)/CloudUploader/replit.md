# Cloudinary File Uploader

## Overview

This is a web-based file uploader application that integrates with Cloudinary for cloud storage. The application provides a simple drag-and-drop interface for uploading various file types including images, videos, and documents. It features a modern, responsive design with real-time upload progress tracking and file management capabilities.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML5, CSS3, and JavaScript
- **Architecture Pattern**: Single Page Application (SPA) with class-based JavaScript
- **UI Framework**: Pure CSS with Font Awesome icons for UI elements
- **Responsive Design**: Mobile-first approach with flexible layouts

### Backend Architecture
- **Cloud Service**: Cloudinary as the primary backend service
- **API Integration**: Direct browser-to-Cloudinary uploads using the Cloudinary Upload Widget
- **Authentication**: Cloudinary upload presets for secure uploads without exposing API secrets

## Key Components

### 1. HTML Structure (`index.html`)
- **Purpose**: Provides the basic layout and structure
- **Key Elements**:
  - Drop zone for drag-and-drop functionality
  - File input for traditional file selection
  - Progress indicators for upload tracking
  - Container for displaying uploaded files
  - Notification system for user feedback

### 2. CSS Styling (`style.css`)
- **Purpose**: Handles visual presentation and user experience
- **Design Approach**: Modern gradient background with card-based layout
- **Features**:
  - Responsive design for multiple screen sizes
  - Smooth transitions and hover effects
  - Visual feedback for drag-and-drop interactions

### 3. JavaScript Logic (`script.js`)
- **Purpose**: Handles file upload logic and user interactions
- **Architecture**: Object-oriented approach with `FileUploader` class
- **Key Features**:
  - Drag-and-drop file handling
  - Progress tracking
  - File validation
  - Cloudinary integration

### 4. Cloudinary Configuration
- **Cloud Name**: `djmed5snv`
- **Upload Preset**: `mycollection`
- **Integration Method**: Cloudinary Upload Widget for secure client-side uploads

## Data Flow

1. **File Selection**: User selects files via drag-and-drop or file browser
2. **Client-side Processing**: JavaScript validates and prepares files for upload
3. **Cloudinary Upload**: Files are uploaded directly to Cloudinary using the Upload Widget
4. **Progress Tracking**: Real-time upload progress is displayed to the user
5. **Response Handling**: Upload results are processed and displayed in the UI
6. **File Management**: Uploaded files are tracked and displayed in the interface

## External Dependencies

### CDN Dependencies
- **Font Awesome 6.0.0**: Icon library for UI elements
- **Cloudinary Upload Widget**: Official Cloudinary JavaScript SDK for file uploads

### Third-party Services
- **Cloudinary**: Primary cloud storage and media management service
  - **Purpose**: File storage, processing, and delivery
  - **Integration**: Direct browser uploads using upload presets
  - **Security**: Preset-based authentication without exposing API keys

## Deployment Strategy

### Current Setup
- **Type**: Static web application
- **Hosting**: Can be deployed on any static hosting service (Netlify, Vercel, GitHub Pages, etc.)
- **Configuration**: Cloudinary credentials are configured directly in the JavaScript

### Requirements
- Web server capable of serving static files
- HTTPS recommended for secure file uploads
- Cloudinary account with configured upload preset

### Security Considerations
- Upload preset configuration in Cloudinary dashboard
- File type and size restrictions can be set at the Cloudinary level
- No sensitive API keys exposed in client-side code

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
- July 06, 2025. Added security features:
  * 2MB file size limit
  * PDF JavaScript scanning for virus detection
  * Duplicate upload prevention
  * Updated Cloudinary credentials
- July 06, 2025. Enhanced document viewing and security:
  * Fixed Chrome PDF blocking with object/embed tags
  * Added comprehensive Office document support (Word, Excel, PowerPoint)
  * Improved virus detection with enhanced alert system
  * Added color-coded document type indicators
  * Implemented shake animation for security alerts
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Development Notes

### Incomplete Implementation
The current `script.js` file appears to be incomplete, containing only the class initialization and drag-and-drop setup methods. Missing implementations include:
- File upload logic
- Progress tracking functionality
- Error handling
- File display after upload
- Notification system

### Required Cloudinary Setup
Before the application can function properly, the following Cloudinary configuration is required:
- Create an upload preset named `mycollection`
- Configure allowed file types and size limits
- Set up any required transformations or folder organization

### Future Enhancements
- Complete the JavaScript implementation
- Add file type validation
- Implement file preview functionality
- Add batch upload capabilities
- Include file deletion functionality
- Add upload history persistence