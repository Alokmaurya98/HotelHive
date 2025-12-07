/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     "./views/**/*.{html,ejs,js}",  // all templates & scripts
    "./public/**/*.{html,js}",     // static JS files
    "./*.js",    
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
