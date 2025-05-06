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

-   **Install packages**

    ```sh
    flux install package-name
    ```

-   **Uninstall packages**

    ```sh
    flux uninstall package-name
    ```

-   **Uninstall all packages**

    ```sh
    flux uninstall all
    ```

-   **List installed packages**

    ```sh
    flux list
    ```

-   **Update a specific package**

    ```sh
    flux update package-name
    ```

-   **Update all packages**

    ```sh
    flux update all
    ```

-   **Reinstall a specific package**

    ```sh
    flux reinstall package-name
    ```

-   **Reinstall all packages**

    ```sh
    flux reinstall all
    ```

-   **Check for available updates**

    ```sh
    flux outdated
    ```

-   **Search the package registry**

    ```sh
    flux search package-name
    ```

### 🔥 **Upcoming**

-   **Global package management** (`flux global install package-name`)
-   **Dependency tree viewer** (`flux tree`)
-   **Lockfile support** for deterministic installs
-   **Command aliases** for faster workflows
-   **Custom registry support** to use alternatives like Verdaccio or pnpm registry

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
flux install express
flux list
flux update express
flux uninstall express
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
