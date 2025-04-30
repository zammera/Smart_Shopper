# SmartShopper Project

## Authors

- Ayoub Darkaoui
- Allen Zammer
- Nika Ashtari
- Sebastian Gyger
- Wu Li

## Overview
SmartShopper is a web application that helps users optimize their grocery shopping by:
- Finding the best deals across multiple stores
- Comparing prices in real-time
- Creating and managing shopping lists
- Locating nearby stores with the best prices
- Tracking price history for items

## Features
- 🔍 Real-time price comparison across stores
- 📍 Location-based store finder
- 📝 Shopping list management
- 💰 Deal alerts and notifications
- 📊 Price history tracking
- 👥 User account management
- 📱 Mobile-responsive design

## Technologies
- Frontend: HTML5, CSS3, JavaScript
- Framework: Bootstrap 5
- Backend: Firebase
- Authentication: Firebase Auth
- Database: Firebase Firestore
- Hosting: Firebase Hosting
- APIs: Google Maps, Places API


## Project Stages:
    | # | Stage                 |
    | - | --------------------- | 
    | 1 | Proposal              |
    | 2 | Prototype             |
    | 3 | Heuristic Evaluation  |
    | 4 | Alpha Release         |
    | 5 | Beta Release          |
    | 6 | Testing and usability |
    | 7 | Final improvements    |
    | 8 | Final Release         |


## Links:

- Figma Prototype: https://www.figma.com/proto/9eHssn6ERXkhksc4AoPC9y/Smart-Shopper-Prototype?node-id=3317-2&p=f&t=K1JOeBN3MKmZFZj5-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=3317%3A2&show-proto-sidebar=1
- GitHub Resource Code: https://github.com/zammera/Smart_Shopper
- Firebase Hosting Service: https://smart-shopper-10261.web.app/
- Project Group Log: https://docs.google.com/spreadsheets/d/1W-8Q3RaCmtuOyaZOCdJa_tB58BZPB0mZ6Vq3ktB_0wo/edit?gid=0#gid=0
- Project Implementation Plan: https://docs.google.com/document/d/1StyDvvU4ctvB8gOIzKPF-xRawdl769je08OxdmvRWxQ/edit?tab=t.0
- Project Video Prototype: https://youtu.be/nCdDPwppskI

## Compilation instructions:

### Prerequisites:
1. Install [Node.js](https://nodejs.org/) (LTS version recommended).
2. Install the Firebase CLI by running:
    ```bash
    npm install -g firebase-tools
    ```
3. Log in to Firebase using the CLI:
    ```bash
    firebase login
    ```

### Steps to Build and Deploy:
1. Clone the repository:
    ```bash
    git clone https://github.com/zammera/Smart_Shopper
    cd Smart_Shopper
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Build the project:
    ```bash
    npm run build
    ```

4. Initialize Firebase (if not already done):
    ```bash
    firebase init
    ```
    - Select "Hosting" when prompted.
    - Choose the Firebase project associated with the app.
    - Set the `build` folder as the public directory.
    - Configure as a single-page app (SPA) if applicable.

5. Deploy to Firebase:
    ```bash
    firebase deploy
    ```

6. Access the deployed app via the Firebase Hosting URL provided after deployment.



## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details


