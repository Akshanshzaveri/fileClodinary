// Cloudinary configuration
const CLOUD_NAME = 'djmed5snv';
const API_KEY = '234574747951161';
const API_SECRET = 'RllCTFAANh930EUIzBzBTmKjol8';

class FileUploader {
    constructor() {
        this.init();
        this.uploadedFiles = [];
        this.uploading = false; // Prevent duplicate uploads
        this.maxFileSize = 2 * 1024 * 1024; // 2MB limit
    }

    init() {
        this.setupEventListeners();
        this.setupDropZone();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    setupDropZone() {
        const dropZone = document.getElementById('dropZone');
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('drag-over');
    }

    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        // Prevent duplicate uploads
        if (this.uploading) {
            this.showNotification('info', 'Upload in Progress', 'Please wait for the current upload to complete');
            return;
        }

        // Process files one by one
        ([...files]).forEach(file => this.processFile(file));
    }

    async processFile(file) {
        try {
            // Check file size
            if (file.size > this.maxFileSize) {
                this.showNotification('error', 'File Too Large', `${file.name} is ${this.formatFileSize(file.size)}. Maximum size allowed is 2MB.`);
                return;
            }

            // Check for PDF with JavaScript (virus detection)
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                const hasJavaScript = await this.scanPDFForJavaScript(file);
                if (hasJavaScript) {
                    this.showVirusDetectionAlert(file.name);
                    return;
                }
            }

            // Upload the file
            await this.uploadFile(file);

        } catch (error) {
            console.error('File processing error:', error);
            this.showNotification('error', 'Processing Error', `Failed to process ${file.name}`);
        }
    }

    async scanPDFForJavaScript(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const text = new TextDecoder().decode(uint8Array);
            
            // Check for common JavaScript patterns in PDF
            const jsPatterns = [
                '/JS',
                '/JavaScript',
                'this.print',
                'app.alert',
                'eval(',
                'unescape(',
                'String.fromCharCode',
                'document.write'
            ];
            
            return jsPatterns.some(pattern => text.includes(pattern));
        } catch (error) {
            console.error('PDF scan error:', error);
            return false; // If scan fails, allow upload
        }
    }

    async uploadFile(file) {
        try {
            // Prevent duplicate uploads
            if (this.uploading) {
                return;
            }
            
            this.uploading = true;
            this.showProgress();
            this.showNotification('info', 'Upload Started', `Uploading ${file.name}...`);

            // Try multiple upload methods
            let response;
            let uploadMethod = '';

            // Method 1: Try with mycollection preset
            try {
                uploadMethod = 'mycollection preset';
                const formData1 = new FormData();
                formData1.append('file', file);
                formData1.append('upload_preset', 'mycollection');
                
                console.log('Trying mycollection preset...');
                response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: 'POST',
                    body: formData1
                });
                
                if (response.ok) {
                    console.log('mycollection preset worked!');
                } else {
                    throw new Error('mycollection preset failed');
                }
            } catch (error) {
                console.log('mycollection preset failed, trying ml_default...');
                
                // Method 2: Try with ml_default preset
                try {
                    uploadMethod = 'ml_default preset';
                    const formData2 = new FormData();
                    formData2.append('file', file);
                    formData2.append('upload_preset', 'ml_default');
                    formData2.append('folder', 'mycollection');
                    
                    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                        method: 'POST',
                        body: formData2
                    });
                    
                    if (response.ok) {
                        console.log('ml_default preset worked!');
                    } else {
                        throw new Error('ml_default preset failed');
                    }
                } catch (error2) {
                    console.log('Both presets failed, trying unsigned upload...');
                    
                    // Method 3: Try with a generic unsigned preset
                    uploadMethod = 'generic preset';
                    const formData3 = new FormData();
                    formData3.append('file', file);
                    formData3.append('upload_preset', 'unsigned_preset');
                    formData3.append('folder', 'mycollection');
                    
                    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                        method: 'POST',
                        body: formData3
                    });
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Upload failed with ${uploadMethod}:`, response.status, errorText);
                
                // Show specific error message based on status
                let errorMsg = 'Upload failed';
                if (response.status === 400) {
                    errorMsg = 'You need to create an upload preset named "mycollection" in your Cloudinary dashboard first';
                } else if (response.status === 401) {
                    errorMsg = 'Invalid API credentials. Please check your Cloudinary settings';
                } else if (response.status === 413) {
                    errorMsg = 'File too large for Cloudinary';
                }
                
                throw new Error(`${errorMsg} (${response.status})`);
            }

            const result = await response.json();
            console.log(`Upload successful using ${uploadMethod}:`, result);
            
            // Store uploaded file info with format detection fallback
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileInfo = {
                originalName: file.name,
                publicId: result.public_id,
                secureUrl: result.secure_url,
                format: result.format || fileExtension, // Use file extension if format not provided
                resourceType: result.resource_type,
                bytes: result.bytes,
                createdAt: result.created_at,
                width: result.width,
                height: result.height
            };

            this.uploadedFiles.push(fileInfo);
            this.hideProgress();
            this.displayUploadedFile(fileInfo);
            this.addToFooterDocuments(fileInfo);
            this.showNotification('success', 'Upload Successful', `${file.name} uploaded successfully!`);

        } catch (error) {
            console.error('Upload error:', error);
            this.hideProgress();
            this.showNotification('error', 'Upload Failed', `Failed to upload ${file.name}. Error: ${error.message}`);
        } finally {
            this.uploading = false; // Reset upload flag
        }
    }

    async generateSignature(timestamp) {
        // Create string to sign
        const stringToSign = `folder=mycollection&timestamp=${timestamp}${API_SECRET}`;
        
        // Use crypto API to generate SHA1 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hash = await crypto.subtle.digest('SHA-1', data);
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    async tryUnsignedUpload(file) {
        try {
            // Try with a basic unsigned preset
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'ml_default'); // Default unsigned preset
            formData.append('folder', 'mycollection');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                // If that fails, try without any preset
                return this.tryBasicUpload(file);
            }

            const result = await response.json();
            
            // Store uploaded file info
            const fileInfo = {
                originalName: file.name,
                publicId: result.public_id,
                secureUrl: result.secure_url,
                format: result.format,
                resourceType: result.resource_type,
                bytes: result.bytes,
                createdAt: result.created_at,
                width: result.width,
                height: result.height
            };

            this.uploadedFiles.push(fileInfo);
            this.hideProgress();
            this.displayUploadedFile(fileInfo);
            this.showNotification('success', 'Upload Successful', `${file.name} uploaded successfully!`);

        } catch (error) {
            console.error('Unsigned upload error:', error);
            this.hideProgress();
            this.showNotification('error', 'Upload Failed', `Please check your Cloudinary settings. You may need to create an upload preset named 'mycollection' in your Cloudinary dashboard.`);
        }
    }

    async tryBasicUpload(file) {
        try {
            // Last resort - try basic upload without preset
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', API_KEY);
            formData.append('timestamp', Math.round((new Date()).getTime() / 1000));

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('All upload methods failed. Please create an upload preset in Cloudinary.');
            }

            const result = await response.json();
            
            // Store uploaded file info
            const fileInfo = {
                originalName: file.name,
                publicId: result.public_id,
                secureUrl: result.secure_url,
                format: result.format,
                resourceType: result.resource_type,
                bytes: result.bytes,
                createdAt: result.created_at,
                width: result.width,
                height: result.height
            };

            this.uploadedFiles.push(fileInfo);
            this.hideProgress();
            this.displayUploadedFile(fileInfo);
            this.showNotification('success', 'Upload Successful', `${file.name} uploaded successfully!`);

        } catch (error) {
            console.error('Basic upload error:', error);
            this.hideProgress();
            this.showNotification('error', 'Upload Failed', 'Please create an upload preset named "mycollection" in your Cloudinary dashboard and set it to unsigned mode.');
        }
    }

    showProgress() {
        const progressElement = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressElement.style.display = 'flex';
        
        // Simulate progress (since we don't have real progress tracking)
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        }, 200);

        // Store interval to clear it later
        this.progressInterval = interval;
    }

    hideProgress() {
        const progressElement = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // Complete the progress
        progressFill.style.width = '100%';
        progressText.textContent = 'Upload Complete!';
        
        setTimeout(() => {
            progressElement.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = 'Uploading... 0%';
        }, 1000);
    }

    displayUploadedFile(fileInfo) {
        const uploadedFilesContainer = document.getElementById('uploadedFiles');
        
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        
        const isImage = fileInfo.resourceType === 'image';
        const isVideo = fileInfo.resourceType === 'video';
        
        fileCard.innerHTML = `
            <div class="file-info">
                <div class="file-name">${fileInfo.originalName}</div>
                <div class="file-details">
                    ${this.formatFileSize(fileInfo.bytes)} • ${fileInfo.format.toUpperCase()}
                    ${fileInfo.width && fileInfo.height ? ` • ${fileInfo.width}×${fileInfo.height}` : ''}
                </div>
            </div>
            
            <div class="file-preview">
                ${isImage ? 
                    `<img src="${this.getThumbnailUrl(fileInfo.secureUrl)}" alt="${fileInfo.originalName}" loading="lazy">` :
                    isVideo ? 
                        `<video width="200" height="150" controls>
                            <source src="${fileInfo.secureUrl}" type="video/${fileInfo.format}">
                        </video>` :
                        `<i class="fas fa-file file-icon"></i>`
                }
            </div>
            
            <div class="file-actions">
                <a href="${fileInfo.secureUrl}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> View File
                </a>
                <button onclick="fileUploader.copyToClipboard('${fileInfo.secureUrl}')" class="btn btn-secondary">
                    <i class="fas fa-copy"></i> Copy URL
                </button>
                <button onclick="fileUploader.deleteFile('${fileInfo.publicId}', this)" class="btn btn-secondary">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        uploadedFilesContainer.appendChild(fileCard);
    }

    getThumbnailUrl(originalUrl) {
        // Generate thumbnail URL for images
        return originalUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('success', 'Copied!', 'URL copied to clipboard');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('success', 'Copied!', 'URL copied to clipboard');
        }
    }

    async deleteFile(publicId, buttonElement) {
        try {
            // Note: Deletion requires authentication, so this is a basic implementation
            // In production, you'd need a backend endpoint for deletion
            this.showNotification('info', 'Delete', 'File deletion requires backend authentication');
            
            // Remove from UI (local only)
            const fileCard = buttonElement.closest('.file-card');
            fileCard.remove();
            
            // Remove from array
            this.uploadedFiles = this.uploadedFiles.filter(file => file.publicId !== publicId);
            
        } catch (error) {
            this.showNotification('error', 'Delete Failed', 'Could not delete file');
        }
    }

    showNotification(type, title, message) {
        const notificationsContainer = document.getElementById('notifications');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${iconMap[type]}"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;
        
        notificationsContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showVirusDetectionAlert(fileName) {
        const notificationsContainer = document.getElementById('notifications');
        
        const notification = document.createElement('div');
        notification.className = 'notification virus-alert';
        notification.style.cssText = `
            background: linear-gradient(135deg, #ff4757, #c44569);
            border: 2px solid #ff3838;
            color: white;
            box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3);
            animation: shake 0.5s ease-in-out;
        `;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon" style="color: #fff; font-size: 1.5em;">
                    <i class="fas fa-shield-virus"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title" style="font-weight: bold; font-size: 1.1em;">
                        🚨 SECURITY THREAT DETECTED
                    </div>
                    <div class="notification-message" style="margin-top: 5px;">
                        <strong>${fileName}</strong> contains potentially malicious JavaScript code.<br>
                        <em>Upload blocked to protect your system.</em>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">
                        💡 Tip: Only upload PDFs from trusted sources
                    </div>
                </div>
            </div>
        `;
        
        notificationsContainer.appendChild(notification);
        
        // Auto remove after 10 seconds (longer for security alerts)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    addToFooterDocuments(fileInfo) {
        const documentsList = document.getElementById('documentsList');
        const noDocumentsMessage = documentsList.querySelector('.no-documents');
        
        // Remove "no documents" message if it exists
        if (noDocumentsMessage) {
            noDocumentsMessage.remove();
        }

        // Create document item
        const documentItem = document.createElement('div');
        documentItem.className = 'document-item';
        
        // Get appropriate icon based on file type
        const icon = this.getFileIcon(fileInfo.format, fileInfo.resourceType);
        
        documentItem.innerHTML = `
            <div class="document-header">
                <i class="${icon} document-icon"></i>
                <div class="document-name">${fileInfo.originalName}</div>
            </div>
            <div class="document-details">
                ${this.formatFileSize(fileInfo.bytes)} • ${fileInfo.format.toUpperCase()}
                <br>
                Uploaded: ${new Date(fileInfo.createdAt).toLocaleDateString()}
            </div>
            <div class="document-actions">
                <button class="document-link" onclick="fileUploader.viewDocument('${fileInfo.publicId}', '${fileInfo.secureUrl}', '${fileInfo.format}', '${fileInfo.resourceType}')">
                    <i class="fas fa-eye"></i>
                    View Document
                </button>
                <a href="${fileInfo.secureUrl}" target="_blank" class="document-link">
                    <i class="fas fa-external-link-alt"></i>
                    Open in New Tab
                </a>
            </div>
            <div class="document-viewer" id="viewer-${fileInfo.publicId}">
                <!-- Document will be displayed here -->
            </div>
        `;
        
        documentsList.appendChild(documentItem);
    }

    getFileIcon(format, resourceType) {
        if (resourceType === 'image') {
            return 'fas fa-image';
        } else if (resourceType === 'video') {
            return 'fas fa-video';
        } else if (format === 'pdf') {
            return 'fas fa-file-pdf';
        } else if (['doc', 'docx'].includes(format)) {
            return 'fas fa-file-word';
        } else if (['xls', 'xlsx'].includes(format)) {
            return 'fas fa-file-excel';
        } else if (['ppt', 'pptx'].includes(format)) {
            return 'fas fa-file-powerpoint';
        } else if (['txt', 'rtf'].includes(format)) {
            return 'fas fa-file-alt';
        } else if (['zip', 'rar', '7z'].includes(format)) {
            return 'fas fa-file-archive';
        } else {
            return 'fas fa-file';
        }
    }

    viewDocument(publicId, secureUrl, format, resourceType) {
        const viewer = document.getElementById(`viewer-${publicId}`);
        
        // Toggle viewer visibility
        if (viewer.classList.contains('active')) {
            viewer.classList.remove('active');
            viewer.innerHTML = '';
            return;
        }

        // Close other open viewers
        document.querySelectorAll('.document-viewer.active').forEach(v => {
            v.classList.remove('active');
            v.innerHTML = '';
        });

        // Show this viewer
        viewer.classList.add('active');

        // Display content based on file type
        if (format === 'pdf') {
            // Use object tag which Chrome allows better than iframe for PDFs
            viewer.innerHTML = `
                <div style="position: relative; background: #f5f5f5; border-radius: 8px; padding: 10px;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <span style="background: #333; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.9em;">
                            <i class="fas fa-file-pdf"></i> PDF Document
                        </span>
                    </div>
                    <object data="${secureUrl}" type="application/pdf" 
                            style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 5px;">
                        <embed src="${secureUrl}" type="application/pdf" 
                               style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 5px;">
                            <div style="text-align: center; padding: 50px; background: white; border-radius: 5px;">
                                <i class="fas fa-file-pdf" style="font-size: 3em; color: #e74c3c; margin-bottom: 15px;"></i>
                                <h4 style="margin-bottom: 10px; color: #333;">PDF Preview Not Available</h4>
                                <p style="color: #666; margin-bottom: 20px;">Your browser doesn't support PDF preview</p>
                                <a href="${secureUrl}" target="_blank" 
                                   style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                    <i class="fas fa-external-link-alt"></i> Open PDF in New Tab
                                </a>
                            </div>
                        </embed>
                    </object>
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="${secureUrl}" target="_blank" style="color: #666; text-decoration: none; font-size: 0.9em;">
                            <i class="fas fa-external-link-alt"></i> Open in full screen
                        </a>
                    </div>
                </div>
            `;
        } else if (resourceType === 'image') {
            viewer.innerHTML = `
                <img src="${secureUrl}" alt="Document image" loading="lazy">
            `;
        } else if (resourceType === 'video') {
            viewer.innerHTML = `
                <video controls style="width: 100%; max-height: 400px;">
                    <source src="${secureUrl}" type="video/${format}">
                    Your browser doesn't support video playback.
                </video>
            `;
        } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(format) || 
                   (resourceType === 'raw' && /\.(docx?|xlsx?|pptx?)$/.test(publicId))) {
            // Use Microsoft Office Online viewer for Office documents
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(secureUrl)}`;
            // Extract format from public_id if not provided (for raw files)
            let safeFormat = format;
            if (!safeFormat && resourceType === 'raw') {
                const match = publicId.match(/\.(docx?|xlsx?|pptx?)$/);
                safeFormat = match ? match[1] : 'doc';
            }
            safeFormat = safeFormat || 'doc'; // Final fallback
            const getDocumentIcon = (fmt) => {
                if (['doc', 'docx'].includes(fmt)) return 'fas fa-file-word';
                if (['xls', 'xlsx'].includes(fmt)) return 'fas fa-file-excel';
                if (['ppt', 'pptx'].includes(fmt)) return 'fas fa-file-powerpoint';
                return 'fas fa-file';
            };
            const getDocumentColor = (fmt) => {
                if (['doc', 'docx'].includes(fmt)) return '#2b5ce6';
                if (['xls', 'xlsx'].includes(fmt)) return '#217346';
                if (['ppt', 'pptx'].includes(fmt)) return '#d24726';
                return '#333';
            };
            viewer.innerHTML = `
                <div style="position: relative; background: #f5f5f5; border-radius: 8px; padding: 10px;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <span style="background: ${getDocumentColor(safeFormat)}; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.9em;">
                            <i class="${getDocumentIcon(safeFormat)}"></i> ${safeFormat.toUpperCase()} Document
                        </span>
                    </div>
                    <iframe src="${officeViewerUrl}" 
                            title="Office Document Viewer" 
                            style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 5px;">
                        <div style="text-align: center; padding: 50px; background: white; border-radius: 5px;">
                            <i class="${getDocumentIcon(format)}" style="font-size: 3em; color: ${getDocumentColor(format)}; margin-bottom: 15px;"></i>
                            <h4 style="margin-bottom: 10px; color: #333;">Document Preview Not Available</h4>
                            <p style="color: #666; margin-bottom: 20px;">Your browser doesn't support document preview</p>
                            <a href="${secureUrl}" target="_blank" 
                               style="background: ${getDocumentColor(format)}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                <i class="fas fa-download"></i> Download Document
                            </a>
                        </div>
                    </iframe>
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="${secureUrl}" target="_blank" style="color: #666; text-decoration: none; font-size: 0.9em;">
                            <i class="fas fa-external-link-alt"></i> Open in full screen
                        </a>
                    </div>
                </div>
            `;
        } else {
            // For other file types, show download link
            viewer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-download" style="font-size: 2em; margin-bottom: 10px;"></i>
                    <p>This file type cannot be previewed.</p>
                    <a href="${secureUrl}" target="_blank" class="document-link">
                        <i class="fas fa-download"></i>
                        Download File
                    </a>
                </div>
            `;
        }
    }
}

// Initialize the file uploader when the page loads
let fileUploader;
document.addEventListener('DOMContentLoaded', () => {
    fileUploader = new FileUploader();
});

// Handle file input change
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (fileUploader && e.target.files.length > 0) {
                fileUploader.handleFiles(e.target.files);
                // Clear the input so the same file can be selected again
                e.target.value = '';
            }
        });
    }
});
