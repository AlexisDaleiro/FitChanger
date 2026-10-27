# Compilación Android en Windows

El proyecto puede permanecer en su ubicación original, incluso si la ruta contiene espacios.

El plugin local `plugins/withWindowsCmake.js` configura, al ejecutar prebuild en Windows:

- `android.cmakeVersion=3.31.6`: usa el CMake del SDK de Android que incluye Ninja 1.12.1.
- `expo.android.cmakeObjectPathMax=240`: pide a CMake acortar las rutas de sus archivos objeto.

Estos ajustes no se aplican al generar proyectos en Linux/macOS y no modifican `node_modules` ni el registro de Windows.

En una nueva instalación de Android Studio, instalar **CMake 3.31.6** desde **SDK Manager → SDK Tools → Show Package Details → CMake**.

Después de cambiar la configuración del plugin:

```powershell
npx expo prebuild --platform android --no-install
npx expo run:android --no-install
```

El SDK debe estar instalado en la ubicación estándar o indicado mediante `ANDROID_HOME`.

Referencias oficiales:

- [Expo: rutas largas en Windows](https://docs.expo.dev/troubleshooting/windows-long-paths/)
- [Expo: propiedad cmakeObjectPathMax](https://github.com/expo/expo/blob/main/packages/expo-modules-autolinking/android/expo-gradle-plugin/README.md)
