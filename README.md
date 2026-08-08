# AccessPath — getting this running on your own computer

This guide assumes you've never done this before. Follow it top to bottom.

## Part 1 — Install two free tools

You only do this once, ever, on this computer.

1. **Install Node.js.** Go to https://nodejs.org and download the version labeled "LTS." Run the installer, click through the defaults. This lets your computer run the AccessPath code.
2. **Install VS Code.** Go to https://code.visualstudio.com, download it for your operating system, and install it. This is the editor you'll use to open and look at the project.

## Part 2 — Open the project

1. Unzip the file you downloaded (`accesspath-app.zip`) somewhere easy to find, like your Desktop.
2. Open VS Code.
3. Go to **File → Open Folder** (Mac: **File → Open**) and choose the unzipped `accesspath-app` folder.
4. In VS Code, open the built-in terminal: **Terminal → New Terminal** in the top menu. A black/dark panel opens at the bottom — this is where you'll type commands.

## Part 3 — Run it

In that terminal, type this and press Enter:

```
npm install
```

This downloads the pieces the app depends on. It takes a minute or two and you'll see a lot of text scroll by — that's normal.

Once it finishes, type:

```
npm run dev
```

You'll see a message with a link like `http://localhost:5173`. Hold Cmd (Mac) or Ctrl (Windows) and click it, or copy it into your browser. **AccessPath is now running on your own computer**, in your own browser.

Try it — click through a section, answer a few questions, close the tab, and reopen the link. Your answers should still be there. That's the localStorage shim doing its job (see the note below).

To stop the app, click into the terminal and press Ctrl+C.

## One honest limitation right now

Your answers are saved to *this specific browser, on this specific device* — not to an account. If you open the app on your phone, it starts fresh. That gets fixed in a later step, once we add real user accounts and a database. For now, this is just about proving the app runs as a real, standalone thing.

## Part 4 — Put it on the internet (optional, but exciting)

Once it's running locally, the fastest way to get a real, shareable web link — no coding required — is **Netlify Drop**:

1. Run `npm run build` in the terminal. This creates a `dist` folder with the finished app.
2. Go to https://app.netlify.com/drop in your browser.
3. Drag the `dist` folder from your computer straight onto that page.
4. Netlify gives you a live URL in seconds — something like `https://random-name-123.netlify.app`. Anyone with that link can open AccessPath from their phone or computer, and even "install" it to their home screen.

## Part 5 — Put it on GitHub (recommended before going further)

GitHub is where your code lives permanently and safely, and it's needed for most of the next steps (like adding a real backend).

1. Create a free account at https://github.com if you don't have one.
2. Click the **+** in the top right → **New repository**. Name it `accesspath-app`. Leave it public or private, your choice. Click **Create repository**.
3. Back in VS Code's terminal, run these one at a time (GitHub will show you the exact commands for your new repo — they'll look like this):

```
git init
git add .
git commit -m "First version of AccessPath"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/accesspath-app.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username. If `git` isn't recognized, install it from https://git-scm.com first, then restart VS Code.

---

That's it for Step 1. Once your code is running locally and pushed to GitHub, we're ready for Step 2: deciding between a native app and a web app, and Step 3: adding real user accounts.
