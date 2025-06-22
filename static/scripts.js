document.addEventListener('DOMContentLoaded', function() {
    // Enable tooltips everywhere
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Auto-expand textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
    
    // Model selection enhancement - make entire card clickable
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.disabled && e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        });
    });

    // Form validation for comparison form
    const comparisonForm = document.querySelector('form[action="/compare"]');
    if (comparisonForm) {
        comparisonForm.addEventListener('submit', function(e) {
            const checkedModels = document.querySelectorAll('input[name="models"]:checked');
            const query = document.getElementById('query').value.trim();
            
            if (checkedModels.length === 0) {
                e.preventDefault();
                showAlert('Please select at least one model for comparison', 'danger');
                return false;
            }
            
            if (!query) {
                e.preventDefault();
                showAlert('Please enter a query', 'danger');
                return false;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
            submitBtn.disabled = true;
        });
    }

    // Copy response to clipboard functionality
    document.querySelectorAll('.copy-response').forEach(button => {
        button.addEventListener('click', function() {
            const responseText = this.closest('.card-body').querySelector('.response-text').textContent;
            navigator.clipboard.writeText(responseText).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check"></i> Copied!';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        });
    });

    // Handle star ratings
    initializeRatingSystem();

    // Toggle API key visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('.api-key-input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
    
    // Save API key
    document.querySelectorAll('.api-key-form').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const modelId = this.dataset.modelId;
            const input = this.querySelector('.api-key-input');
            const statusDiv = this.querySelector('.api-key-status');
            const saveBtn = this.querySelector('.save-api-key');
            const originalBtnText = saveBtn.innerHTML;
            
            // Show loading state
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            saveBtn.disabled = true;
            
            try {
                const response = await fetch('/api/settings/keys', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model_id: modelId,
                        api_key: input.value
                    })
                });
                
                const data = await response.json();
                
                statusDiv.innerHTML = `<div class="alert alert-success">
                                        <i class="bi bi-check-circle"></i> ${data.message}
                                      </div>`;
                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 3000);
            } catch (error) {
                statusDiv.innerHTML = `<div class="alert alert-danger">
                                        <i class="bi bi-exclamation-triangle"></i> Error saving API key
                                      </div>`;
            } finally {
                saveBtn.innerHTML = originalBtnText;
                saveBtn.disabled = false;
            }
        });
    });

    // Clear history confirmation
    const clearHistoryBtn = document.getElementById('clearHistory');
    const confirmClearBtn = document.getElementById('confirmClearHistory');
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('clearHistoryModal'));
            modal.show();
        });
    }
    
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/history/clear', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    console.error('Failed to clear history');
                    showAlert('Failed to clear history', 'danger');
                }
            } catch (error) {
                console.error('Error clearing history:', error);
                showAlert('Error clearing history', 'danger');
            }
        });
    }

    // Export results functionality (for results page)
    const exportResultsBtn = document.getElementById('exportResults');
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', function() {
            const query = document.querySelector('.query-display').textContent.replace('Query: ', '');
            const results = [];
            
            document.querySelectorAll('.result-card').forEach(card => {
                const modelName = card.querySelector('.card-header strong').textContent;
                const responseText = card.querySelector('.response-text')?.textContent || 'Error: ' + card.querySelector('.alert-danger')?.textContent;
                
                results.push({
                    model: modelName,
                    response: responseText
                });
            });
            
            const exportData = {
                query: query,
                timestamp: new Date().toISOString(),
                results: results
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "llm-comparison-" + new Date().getTime() + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }
});

// Helper function to show alerts
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.className = 'alert-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1050';
    document.body.appendChild(container);
    return container;
}

// Initialize rating system for results page
function initializeRatingSystem() {
    document.querySelectorAll('.rating-stars').forEach(starsContainer => {
        const stars = starsContainer.querySelectorAll('.rating-star');
        const modelRating = starsContainer.closest('.model-rating');
        
        if (!modelRating) return;
        
        const modelId = modelRating.dataset.modelId;
        const queryIndex = modelRating.dataset.queryIndex;
        
        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.dataset.rating);
                highlightStars(stars, rating);
            });
            
            star.addEventListener('mouseout', function() {
                resetStars(stars);
            });
            
            star.addEventListener('click', async function() {
                if (this.disabled) return;
                
                const rating = parseInt(this.dataset.rating);
                const originalContent = starsContainer.innerHTML;
                
                // Show loading state
                starsContainer.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Rating...';
                
                try {
                    const response = await fetch('/api/rate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model_id: modelId,
                            query_index: parseInt(queryIndex),
                            rating: rating
                        })
                    });
                    
                    if (response.ok) {
                        // Restore stars
                        starsContainer.innerHTML = originalContent;
                        const updatedStars = starsContainer.querySelectorAll('.rating-star');
                        
                        // Permanently highlight stars
                        highlightStars(updatedStars, rating, true);
                        
                        // Disable further rating
                        updatedStars.forEach(s => {
                            s.disabled = true;
                            s.classList.remove('btn-outline-secondary');
                            s.classList.add('btn-secondary');
                        });
                        
                        // Show success indicator
                        const successSpan = document.createElement('span');
                        successSpan.className = 'ms-2 text-success';
                        successSpan.innerHTML = '<i class="bi bi-check-circle"></i> Rated';
                        modelRating.appendChild(successSpan);
                        
                        setTimeout(() => {
                            successSpan.remove();
                        }, 3000);
                    } else {
                        throw new Error('Failed to submit rating');
                    }
                } catch (error) {
                    console.error('Error submitting rating:', error);
                    starsContainer.innerHTML = originalContent;
                    showAlert('Failed to submit rating', 'danger');
                }
            });
        });
    });
}

function highlightStars(stars, rating, permanent = false) {
    stars.forEach((s, index) => {
        const starIcon = s.querySelector('i');
        if (index < rating) {
            starIcon.classList.remove('bi-star');
            starIcon.classList.add('bi-star-fill');
            if (permanent) {
                s.classList.remove('btn-outline-secondary');
                s.classList.add('btn-warning');
            }
        } else {
            starIcon.classList.remove('bi-star-fill');
            starIcon.classList.add('bi-star');
            if (permanent) {
                s.classList.remove('btn-outline-secondary');
                s.classList.add('btn-secondary');
            }
        }
    });
}

function resetStars(stars) {
    stars.forEach(s => {
        if (!s.classList.contains('btn-warning') && !s.classList.contains('btn-secondary')) {
            const starIcon = s.querySelector('i');
            starIcon.classList.remove('bi-star-fill');
            starIcon.classList.add('bi-star');
        }
    });
}

// Add this to your scripts.js file

document.addEventListener('DOMContentLoaded', function() {
    // Handle active navigation links
    const currentPath = window.location.pathname;
    
    // Find all nav links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        // Get the href attribute
        const href = link.getAttribute('href');
        
        // Special case for home
        if (href === '/' && currentPath === '/') {
            link.classList.add('active');
        }
        // For other pages
        else if (href !== '/' && currentPath.startsWith(href)) {
            link.classList.add('active');
        }
        else {
            link.classList.remove('active');
        }
        
        // Handle results page specially since it's not directly linked
        if (link.querySelector('i.bi-chat-text') && currentPath.includes('/compare')) {
            link.classList.add('active');
            link.style.display = 'block';
        }
    });
});