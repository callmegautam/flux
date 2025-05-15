# **Flux — A Minimal, Modern Package Manager**

Flux is a lightweight, minimalistic package manager designed to streamline dependency management in JavaScript projects. It offers fast, reliable tools for installing, updating, removing, and managing packages — with more powerful features on the roadmap.

⚠️ **Alpha Release:** Flux is currently in active development and **not yet recommended for production use**. We welcome developers and contributors to help shape its future!

---

## 📚 Table of Contents

-   [Features](#-features)
    -   [Implemented](#-implemented)
    -   [Upcoming](#-upcoming)
-   [Installation](#-installation)
-   [Usage](#-usage)
-   [Contributing](#-contributing)
-   [License](#-license)

---

## ✨ Features

### ✅ **Implemented**

-   **Initialize a new project**

    ```sh
    flux init
    ```

-   **Install a package**

    ```sh
    flux install package-name
    ```

-   **Install dependencies from package.json**

    ```sh
    flux install
    ```

-   **Uninstall a package**

    ```sh
    flux uninstall package-name
    ```

-   **Reinstall a package**

    ```sh
    flux reinstall package-name
    ```

-   **Update a package**

    ```sh
    flux update package-name
    ```

-   **List installed packages**

    ```sh
    flux list
    ```

-   **Check for outdated packages**

    ```sh
    flux outdated
    ```

-   **Search the package registry**

    ```sh
    flux search package-name
    ```

-   **Run scripts defined in package.json**

    ```sh
    flux run script-name
    ```

### 🔥 **Upcoming**

-   Dependency tree viewer (`flux tree`)
-   Lockfile support for deterministic installs
-   Custom registry support (e.g., Verdaccio, pnpm registry)
-   Enhanced caching for faster installs
-   Parallel installation of packages
-   Improved error handling and diagnostics
-   Support for workspace and monorepo management
-   Interactive CLI prompts for easier usage
-   Integration with popular CI/CD pipelines
-   Automatic semantic versioning and changelog generation
-   Offline mode for working without internet connection
-   Package audit and vulnerability scanning

---

## 🚀 Installation

The current **alpha release** is available as a Windows installer.

-   **Executable location in repo:**
    `flux/install/install_flux.exe`

-   **Direct download:**
    [Flux Installer v0.1.0-alpha](https://github.com/callmegautam/flux/releases/download/v0.1.0-alpha/install_flux.exe)

### Setup instructions

1. Download the `.exe` installer.
2. **Run as Administrator.**
   If prompted by Windows Defender, click **“Run anyway.”**
   _(Note: The warning appears because we don’t yet have a signed publisher certificate. You can review the `install_flux.ps1` script to verify its safety.)_

### Updating Flux

To update Flux, simply re-run the latest installer — it will handle the update automatically.

---

## ⚙️ Usage

Here’s a quick example to get you started:

```sh
flux init
flux install express
flux list
flux update express
flux uninstall express
flux run build
```

For detailed documentation, visit the [Wiki](https://github.com/callmegautam/flux/wiki) _(coming soon)_.

---

## 💡 Contributing

We welcome contributors of all levels! Here’s how to get involved:

1. Fork this repository.

2. Create a feature branch:

    ```sh
    git checkout -b feature/your-feature-name
    ```

3. Commit your changes and push:

    ```sh
    git push origin feature/your-feature-name
    ```

4. Open a **pull request** with a clear description.

👉 Check the [issues](https://github.com/callmegautam/flux/issues) tab for open tasks, feature requests, or bugs.

---

## 🌟 Get Involved

Be part of building a better package manager for JavaScript developers!

-   Download the alpha
-   Share feedback or bug reports
-   Submit pull requests
-   Star the repository to show your support ⭐

---

## 📄 License

Flux is open-source software, licensed under the [MIT License](LICENSE).

---

✅ **Note:** As an alpha project, Flux is rapidly evolving — expect frequent changes and improvements as we move toward a stable release.
