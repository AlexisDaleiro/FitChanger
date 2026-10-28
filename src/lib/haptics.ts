import * as Haptics from 'expo-haptics';

// SPEC-GAP: No existe un contrato de ajustes para hapticsEnabled; cada llamada recibe el valor explícitamente.
async function perform(
  hapticsEnabled: boolean,
  feedback: () => Promise<void>,
): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    await feedback();
  } catch (error) {
    console.warn('[haptics] Native feedback failed', error);
  }
}

export function selection(hapticsEnabled: boolean): Promise<void> {
  return perform(hapticsEnabled, () => Haptics.selectionAsync());
}

export function setLogged(hapticsEnabled: boolean): Promise<void> {
  return perform(hapticsEnabled, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  );
}

export function restWarning(hapticsEnabled: boolean): Promise<void> {
  return perform(hapticsEnabled, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
}

export function success(hapticsEnabled: boolean): Promise<void> {
  return perform(hapticsEnabled, () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function warning(hapticsEnabled: boolean): Promise<void> {
  return perform(hapticsEnabled, () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}
