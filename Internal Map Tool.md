# Internal Map Tool

A lightweight, single-page web application for internal mapping with point management and power line visualization. Built with pure HTML, CSS, and JavaScript using Leaflet for mapping and Firebase for authentication.

## Features

- **Interactive Map**: Click to add points with titles and notes
- **Power Line Drawing**: Connect two points with labeled power lines
- **Data Persistence**: All data saved to localStorage with export/import functionality
- **Role-Based Access**: Google authentication with viewer/editor roles
- **Responsive Design**: Works on desktop and mobile devices
- **No Build Tools**: Pure ES6, ready to deploy

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in provider
   - Add your domain to authorized domains
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Web app" icon to create/view web app
   - Copy the configuration object

### 2. Configure Application

Edit `script.js` and update the following variables:

```javascript
// Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Replace with your whitelisted email
const WHITELISTED_EMAIL = "your-email@example.com";
```

### 3. Deploy to GitHub Pages

#### Option A: Using GitHub Web Interface

1. Create a new repository on GitHub
2. Upload all files (`index.html`, `style.css`, `script.js`, `example-data/`)
3. Create a `.nojekyll` file in the root directory
4. Go to repository Settings > Pages
5. Select source: "Deploy from a branch"
6. Choose branch: `main` and folder: `/ (root)`
7. Save and wait for deployment

#### Option B: Using Git Commands

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Create .nojekyll file
echo "" > .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll for GitHub Pages"

# Add remote and push
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git branch -M main
git push -u origin main

# Enable GitHub Pages in repository settings
```

### 4. Alternative: Deploy to Netlify

1. Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository to Netlify
3. No build configuration needed - it's a static site

## Configuration Details

### Firebase Authentication Setup

1. **Enable Google Sign-in**:
   - Firebase Console > Authentication > Sign-in method
   - Click Google and toggle "Enable"
   - Add your domain (e.g., `username.github.io`) to authorized domains

2. **Security Rules** (Optional):
   - For enhanced security, you can set up Firestore rules
   - Currently using client-side email whitelist

### Role Management

The application supports two roles:

- **Viewer**: Can view map, points, and power lines; can export data
- **Editor**: Full access including adding/editing/deleting points and lines; can import data

Role assignment is currently based on the whitelisted email in the code. For multiple users:

```javascript
// Example: Multiple whitelisted emails with roles
const AUTHORIZED_USERS = {
    "admin@company.com": "editor",
    "viewer1@company.com": "viewer",
    "viewer2@company.com": "viewer"
};
```

### Data Structure

The application stores data in the following format:

```json
{
    "points": [
        {
            "id": "unique_id",
            "title": "Point Title",
            "note": "Point description",
            "lat": 40.7128,
            "lng": -74.0060,
            "timestamp": 1640995200000
        }
    ],
    "lines": [
        {
            "id": "unique_id",
            "label": "Power Line Label",
            "points": [
                {"lat": 40.7128, "lng": -74.0060},
                {"lat": 40.7589, "lng": -73.9851}
            ],
            "timestamp": 1640995200000
        }
    ]
}
```

## Usage Instructions

### Adding Points

1. Ensure you're signed in as an editor
2. Click "Add Point" tool (default)
3. Click anywhere on the map
4. Fill in the title and optional notes
5. Click "Save Point"

### Drawing Power Lines

1. Click "Draw Power Line" tool
2. Click two points on the map to define the line
3. Enter a label for the power line
4. Click "Save Line"

### Data Management

- **Export**: Click "Export" to download current data as JSON
- **Import**: Click "Import" to load data from a JSON file
- **Local Storage**: Data is automatically saved to browser localStorage

### Mobile Usage

The application is fully responsive:
- Controls panel moves to bottom on mobile
- Touch-friendly interface
- Optimized for small screens

## File Structure

```
map-webapp/
├── index.html          # Main HTML file
├── style.css           # Styling and responsive design
├── script.js           # Application logic and Firebase integration
├── .nojekyll          # GitHub Pages configuration
├── README.md          # This documentation
└── example-data/
    └── map.json       # Sample data file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires ES6 support and modern JavaScript features.

## Security Considerations

1. **Client-side Authentication**: Email whitelist is enforced client-side
2. **HTTPS Required**: Firebase Auth requires HTTPS in production
3. **Domain Restrictions**: Configure authorized domains in Firebase
4. **Data Privacy**: All data stored locally in browser localStorage

## Troubleshooting

### Common Issues

1. **"Configuration error" on load**:
   - Check Firebase configuration in `script.js`
   - Ensure all Firebase keys are correctly set

2. **"Access denied" after Google sign-in**:
   - Verify your email matches `WHITELISTED_EMAIL`
   - Check browser console for authentication errors

3. **Map not loading**:
   - Check internet connection (requires CDN access)
   - Verify Leaflet CDN URLs are accessible

4. **GitHub Pages not updating**:
   - Check if `.nojekyll` file exists
   - Verify GitHub Pages is enabled in repository settings
   - Wait a few minutes for deployment

### Debug Mode

Add this to browser console for debugging:

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// View current app state
console.log(AppState);

// View stored data
console.log(JSON.parse(localStorage.getItem('mapData')));
```

## Development

### Code Structure

The application follows these principles:

- **Pure ES6**: No transpilation or build tools required
- **Function Limit**: All functions ≤ 50 lines as specified
- **Clear Comments**: Comprehensive documentation in code
- **Modular Design**: Separate concerns for auth, map, and data

### Adding Features

To extend the application:

1. **New Point Types**: Modify `addPointToMap()` and point data structure
2. **Additional Line Styles**: Update `addLineToMap()` with new styling options
3. **Enhanced Roles**: Expand role system in authentication logic
4. **Data Validation**: Add validation in save functions

### Performance Considerations

- **Local Storage Limits**: Browser localStorage typically limited to 5-10MB
- **Map Performance**: Large datasets may impact map rendering
- **Memory Usage**: Consider cleanup for removed map layers

## License

This project is provided as-is for internal use. Modify and distribute according to your organization's policies.

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify Firebase configuration and authentication setup
4. Test with the provided example data

---

**Built with**: Leaflet.js, Firebase Auth, OpenStreetMap, Pure JavaScript ES6

