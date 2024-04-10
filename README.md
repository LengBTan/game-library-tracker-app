# COMP2406Project
A web application that stores a user's game collection using the IGDB API. 

- Built with Express.js, Handlebars, and SQlite

# Requirements:
- Node.js
- SQlite

# Install Instructions:
- Enter `npm install` in the terminal to download all required modules to run the code

# Launch Instructions:
- Launch the server with the command: 'node server.js' in the terminal

# Testing Instructions:
- In a browser, enter the following addresses in the url:
    - http://localhost:3000/
    - http://localhost:3000/index.html

- Logging in/registering:
    - Log in with the following credentials and press "Log In":
        - user: admin password: password
    - Register as a guest by pressing the "Register for an account" button and enter
    a username and password for the account

- Adding a game to the library:
    - Press the "🔍 Search Games" button in the header
    - Enter a game name in the text field and press the "Search" button
    - press the "+" button in the "Add to library" column for the row of the
      game to add it to the library
    
- Remove a game from the library by pressing "❌" in the dashboard page

- View details and similar games by pressing the game title in the dashboard page
  
- As an admin, view all registered users by pressing the "👤 Users in the DB" button
  in the dashboard

- Log out of the website by pressing the logout button in the header of the dashboard