# Android local en Windows

El emulador de este proyecto usa `x86_64`. El plugin `withWindowsCmake`
establece esa arquitectura en `android/gradle.properties`, también después
de regenerar Android con Expo. Así una build release local no compila las
cuatro arquitecturas por defecto.

Desarrollo habitual:

```powershell
npm run android
```

Verificación de rendimiento en el emulador:

```powershell
npx expo run:android --variant release --no-install --no-bundler
```

Para un teléfono ARM64, generar un APK release específico:

```powershell
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Para distribuir a varios tipos de dispositivo, elegir explícitamente las
arquitecturas necesarias o usar un Android App Bundle. El APK `x86_64` local
está destinado al emulador.

Los directorios `.cxx/RelWithDebInfo` y los intermedios de `release` son
regenerables. Después de limpiarlos, la siguiente build release volverá
a compilarlos, pero solo para la arquitectura elegida. Los cambios de
TypeScript habituales se sirven con Metro y no requieren limpiar Android.

Se conservan los APK existentes en `android/app/build/outputs/apk` y la
caché Debug de `x86_64`. No ejecutar `gradlew clean` para liberar espacio
si se quiere conservar esa caché.
