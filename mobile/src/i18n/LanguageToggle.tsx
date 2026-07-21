import { View, type ViewStyle } from 'react-native';
import { Segmented } from '../ui/Segmented';
import { useI18n } from './I18nProvider';
import { LANGS, type Lang } from './translations';

// Compact EN / ES switcher. Drop it in a screen header or settings row.
export function LanguageToggle({ style, width = 108 }: { style?: ViewStyle; width?: number }) {
  const { lang, setLang } = useI18n();
  return (
    <View style={[{ width }, style]}>
      <Segmented<Lang> options={LANGS} value={lang} onChange={setLang} />
    </View>
  );
}
