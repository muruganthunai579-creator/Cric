# PanchaPakshi CRI-PREDICT 🏏✨

A sophisticated Vedic Astrology-based Cricket Prediction tool that combines the ancient **Pancha Pakshi Shastra** (Five Birds Astrology) with modern astronomical calculations and AI insights.

## 🌟 Features

-   **Pancha Pakshi Calculation**: Authentic logic based on the *Nithra 2021* book.
-   **Accurate Astronomy**: Calculates precise **Sunrise/Sunset** and **Yamas** (time slots) based on the match location (Latitude/Longitude).
-   **Moon Phase Logic**: Support for both **Shukla Paksha** (Waxing) and **Krishna Paksha** (Waning) with correct bird mapping updates.
-   **Match Flow Timeline**: Generates a minute-by-minute dominance chart based on the Ruling Bird and Friend/Enemy relationships.
-   **Toss Prediction**: Specific astrological calculation for the toss time.
-   **AI Astrologer**: Integrated Google Gemini API for mystical insights and chat.
-   **T20 / ODI Support**: Adjusts flow timelines for different match durations.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/panchapakshi-cripredict.git
    cd panchapakshi-cripredict
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root directory and add your Google Gemini API Key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🛠️ Build & Deploy

To create a production build:

```bash
npm run build
```

### Netlify Deployment

This project includes a `netlify.toml` configuration. Simply connect your GitHub repository to Netlify, and it will auto-detect the settings.

## 📚 How It Works

1.  **Select Captains**: Enter details or select Date of Birth to auto-calculate the **Nakshatra** (Star).
2.  **Location**: Choose the match city. The app calculates the exact solar day duration for that specific geocoordinate.
3.  **Analysis**: The engine determines the **Ruling Bird** for the specific time slot and compares it with the Captain's bird using "Friend/Enemy/Self" logic.
4.  **Prediction**: Generates a winner probability, toss winner, and a detailed dominance timeline.

## 📜 License

This project is licensed under the MIT License.
