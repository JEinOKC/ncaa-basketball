### **Backend `backend/README.md`**
```md
# 🏗️ College Basketball Backend

This Node.js backend generates JSON files for college basketball data.

## 🚀 Getting Started

### 1️⃣ Install Dependencies
```sh
npm install
```

### 2️⃣ Turn on the Server
```sh
npm run dev
```

### 3️⃣ Generate the JSON data
```sh
node build-rankings.ts
```


This will create JSON files in `../data/`.

## 📁 Project Structure
```
/src
  /config		   # JSON files containing constant data
  /lib			   # Worker Files
  /server.ts		   # main express server
  /build-rankings.ts		# standalone rankings builder 
/tsconfig.json     # TypeScript config
```

## 🛠️ Notes
- This backend can be run using the docker files in the root of the project
- rankings can be built using the express server on the /api/generate-rankings endpoint
```