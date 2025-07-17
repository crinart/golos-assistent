# Internal Map Tool - Deployment Playbook

## Overview

This playbook provides step-by-step instructions for deploying and configuring the Internal Map Tool, a lightweight web application for mapping with point management and power line visualization.

## Prerequisites

- Google account for Firebase authentication
- GitHub account (for GitHub Pages deployment)
- Basic understanding of Firebase console
- Text editor for configuration

## Deployment Steps

### Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Navigate to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or select existing project
   - Follow the setup wizard (Analytics optional)

2. **Enable Authentication**
   - In Firebase Console, go to "Authentication"
   - Click "Get started" if first time
   - Go to "Sign-in method" tab
   - Click "Google" provider
   - Toggle "Enable" switch
   - Add your deployment domain to "Authorized domains"
   - Click "Save"

3. **Get Configuration Keys**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click web app icon `</>` or select existing web app
   - Copy the `firebaseConfig` object

### Step 2: Application Configuration

1. **Update Firebase Configuration**
   - Open `script.js` in text editor
   - Find the `firebaseConfig` object (around line 20)
   - Replace placeholder values with your Firebase config:

   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSyC...",                    // Your API key
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123def456"
   };
   ```

2. **Set Whitelisted Email**
   - In same `script.js` file, find `WHITELISTED_EMAIL` (around line 32)
   - Replace with your email address:

   ```javascript
   const WHITELISTED_EMAIL = "your-email@gmail.com";
   ```

### Step 3: GitHub Pages Deployment

1. **Create Repository**
   - Go to [GitHub](https://github.com) and create new repository
   - Name it something like `internal-map-tool`
   - Make it public or private (your choice)
   - Don't initialize with README (we have files)

2. **Upload Files**
   - Upload all project files to repository:
     - `index.html`
     - `style.css`
     - `script.js`
     - `.nojekyll`
     - `README.md`
     - `example-data/map.json`

3. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
   - Note the provided URL (e.g., `https://username.github.io/internal-map-tool`)

4. **Update Firebase Authorized Domains**
   - Return to Firebase Console > Authentication > Sign-in method
   - Add your GitHub Pages URL to authorized domains
   - Remove `http://` or `https://` prefix, just add the domain

### Step 4: Alternative Netlify Deployment

1. **Quick Deploy**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag and drop your project folder
   - Note the provided URL

2. **GitHub Integration** (Optional)
   - Connect your GitHub repository to Netlify
   - Enable automatic deployments on push

### Step 5: Testing and Verification

1. **Access Application**
   - Navigate to your deployed URL
   - Should see login screen with Google sign-in button

2. **Test Authentication**
   - Click "Sign in with Google"
   - Use the whitelisted email account
   - Should redirect to main application

3. **Test Functionality**
   - Verify map loads (OpenStreetMap tiles)
   - Test adding points by clicking map
   - Test drawing power lines between points
   - Test export/import functionality

## Configuration Options

### Multiple User Support

To support multiple users with different roles:

```javascript
// Replace single email check with user mapping
const AUTHORIZED_USERS = {
    "admin@company.com": "editor",
    "manager@company.com": "editor", 
    "viewer1@company.com": "viewer",
    "viewer2@company.com": "viewer"
};

// Update authentication logic accordingly
```

### Custom Styling

Modify `style.css` to match your organization's branding:

- Update color scheme in CSS variables
- Change fonts and typography
- Modify login screen background
- Adjust responsive breakpoints

### Map Configuration

In `script.js`, customize map settings:

```javascript
// Change default map center and zoom
AppState.map = L.map('map').setView([YOUR_LAT, YOUR_LNG], ZOOM_LEVEL);

// Use different tile provider
L.tileLayer('https://your-tile-server/{z}/{x}/{y}.png', {
    attribution: 'Your attribution'
}).addTo(AppState.map);
```

## Maintenance

### Regular Tasks

1. **Monitor Usage**
   - Check Firebase Authentication usage
   - Monitor localStorage data size
   - Review user feedback

2. **Updates**
   - Keep CDN links updated (Leaflet, Firebase)
   - Test with new browser versions
   - Update documentation as needed

3. **Backup**
   - Export data regularly using built-in export function
   - Keep backup of configuration files
   - Document any customizations

### Troubleshooting

1. **Authentication Issues**
   - Verify Firebase configuration
   - Check authorized domains
   - Confirm email whitelist

2. **Map Loading Problems**
   - Test CDN accessibility
   - Check browser console for errors
   - Verify internet connectivity

3. **Data Loss**
   - localStorage can be cleared by users
   - Implement regular export reminders
   - Consider server-side storage for critical data

## Security Considerations

1. **Client-Side Security**
   - Email whitelist enforced in browser
   - Consider server-side validation for sensitive data
   - Use HTTPS for all deployments

2. **Firebase Security**
   - Regularly review authorized domains
   - Monitor authentication logs
   - Consider implementing Firestore rules

3. **Data Privacy**
   - All data stored locally in browser
   - No server-side data storage by default
   - Users responsible for their own data backup

## Support and Documentation

- **User Guide**: See README.md for end-user instructions
- **Technical Details**: Review code comments in script.js
- **Firebase Docs**: [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- **Leaflet Docs**: [Leaflet Documentation](https://leafletjs.com/reference.html)

## Version History

- **v1.0**: Initial release with core functionality
  - Point management with title/notes
  - Power line drawing between points
  - Firebase Google authentication
  - Role-based access (viewer/editor)
  - Export/import JSON data
  - Responsive design for mobile/desktop

---

**Deployment completed**: Application is ready for production use after following this playbook.

