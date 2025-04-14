# **Flux - A Minimal Package Manager**

Flux is a lightweight package manager designed to simplify dependency management for JavaScript projects. With support for basic package installation, uninstallation, listing installed packages, updating packages, and now reinstalling packages, Flux is steadily evolving. More features are on the way!

🚧 **Alpha Version**: Flux is still in its early development phase and not yet ready for production use. We welcome contributors to help shape its future!

---

## **Table of Contents**

-   [Features](#-features)
    -   [Implemented](#-implemented)
    -   [Upcoming Features](#-upcoming-features)
-   [Alpha Version](#-alpha-version)
-   [Contributing](#-contributing)
-   [License](#-license)

---

## **✨ Features**

### ✅ **Implemented**

-   **Install Packages**: Download and add packages to `node_modules`.

    ```sh
    flux install package-name
    ```

-   **Uninstall Packages**: Remove installed packages from `node_modules`.

    ```sh
    flux uninstall package-name
    ```

-   **Uninstall All Packages**: Remove all installed packages from `node_modules`.

    ```sh
    flux uninstall all
    ```

-   **List Installed Packages**: Display all installed dependencies.

    ```sh
    flux list
    ```

-   **Update a Package**: Update a specific package to its latest version.

    ```sh
    flux update package-name
    ```

-   **Update All Packages**: Update all installed packages to their latest versions.

    ```sh
    flux update all
    ```

-   **Reinstall a Package**: Reinstall a specific package.

    ```sh
    flux reinstall package-name
    ```

-   **Reinstall All Packages**: Reinstall all packages in `node_modules`.

    ```sh
    flux reinstall all
    ```

-   **Check for Updates**: List packages with newer versions available.

    ```sh
    flux outdated
    ```

-   **Search for Packages**: Find packages from the registry.

    ```sh
    flux search package-name
    ```

### 🔜 **Upcoming Features**

-   **Global Package Management** (`flux global install package-name`): Install packages globally.
-   **Dependency Tree Viewer** (`flux tree`): View package dependency hierarchy.
-   **Lockfile Support**: Ensure deterministic installs.
-   **Alias Support**: Shortcuts for common commands.
-   **Custom Registry Support**: Use alternative registries instead of npm.

---

## **🚀 Alpha Version**

If you'd like to try the alpha version of Flux, you can download the installer `.exe` from the repository or directly from this link:

-   **Exe Location in Repo**: `flux/install/install_flux.exe`
-   **Download Link**: [Flux Installer](https://github.com/iamgautamsuthar/flux/releases/download/v0.1.0-alpha/install_flux.exe)

### How to Install:

1. Download the `.exe` file from the link or repository.
2. **Run it as Admin**. If Windows Defender blocks it, simply click on **"Run anyway"**.
    - Please note that this warning occurs because we don't have a publisher license. It's completely safe, and you can review the installation script (`install_flux.ps1`) to verify its safety.

### To Update:

-   To get the latest version of Flux, just **reinstall the installer**, and it will automatically update to the latest version.

---

## **💡 Contributing**

Flux is open for contributions! If you have ideas, bug fixes, or feature requests, feel free to open an issue or submit a pull request.

1. Fork the repository.
2. Create a new branch for your feature.
3. Submit a pull request for review.

We appreciate your support in making Flux better!

---

## **🌟 Get Started with Flux**

Ready to simplify your dependency management? Download the alpha version now and join the Flux community! Your feedback and contributions are invaluable as we build the next-generation package manager.

---

## **📜 License**

Flux is open-source and licensed under the [MIT License](LICENSE).

---

⚠️ **Note**: Flux is still in its **alpha phase**, so expect changes and improvements before the first stable release.
