import { useIsMobile } from './useIsMobile';
import { useElementWidth } from './useElementWidth';

/**
 * Whether a list should show as record cards instead of its table. Attach
 * `ref` to the list's Card: below `tableMinWidth` px of it -- or on any phone
 * -- `showCards` is true. The Card's own width is what counts, not the
 * viewport's, since the sidebar (a 4rem rail or an 18rem panel) decides how
 * much of the viewport the table actually gets.
 *
 * `isMobile` is passed back too, for the phone-only touches (a bare Card,
 * full-width pagination); `width` is null until measured.
 */
export function useCardLayout(tableMinWidth) {
  const isMobile = useIsMobile();
  const [ref, width] = useElementWidth();
  return {
    ref,
    isMobile,
    width,
    showCards: isMobile || (width !== null && width < tableMinWidth),
  };
}
