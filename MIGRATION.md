## Migration

### Migrating from v2 to v3

- Dependencies such as ftdomdelegate, o-icons, o-viewport, and o-layers have been upgraded and a new dependency on o-typography has been added. Confirm your project is compatible (builds without conflicts).
- Uses [ECMAScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) instead of [CommonJS modules](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Using#Importing_CommonJS_modules). If you use the CommonJS module syntax you may need to replace `require('o-overlay')` with `require('o-overlay').default;`.
- [Deprecated color usecases](https://github.com/Financial-Times/o-overlay/blob/v2.7.2/src/scss/_deprecated.scss#L3) have been removed. Ensure your project's Sass does not use these colours.
- If multiple overlays with the same id are created an error is now thrown (previously a console warning). Ensure your overlays have a unique id. The id is set set with the `data-o-overlay-id` attribute, or as the first argument to the overlay constructor `new Overlay('myId', {})`.

### Migrating from v1 to v2

- Arrows functionality has now been removed. __Resolution__ If you need an overlay with an arrow, please use [o-tooltip](http://github.com/financial-times/o-tooltip).
- A dependency on [o-icons](http://github.com/financial-times/o-icons) v4 or v5 has been introduced. This will break any builds that use o-icons <v3. __Resolution__: Ideally you should upgrade to o-icons v5, but if you still need to use the old icon set (in v4) then upgrading to o-icons v4 will also work.
- A dependency on [o-visual-effects](http://github.com/financial-times/o-visual-effects) v1 has been introduced. This will break any builds that use o-visual-effects <v1. __Resolution__: Update to v1 of o-visual-effects.
- A dependency on [o-normalise](http://github.com/financial-times/o-normalise) v1 has been introduced. This is not likely to introduce any conflicts as it is only v1.
- The mixin oOverlayCompactCloseIcon (deprecated in v1.3.0) has been removed. __Resolution__ Use the `@oOverlayCloseIcon` mixin.
- All extends (deprecated in v1.2.0) have been removed. __Resolution__: Use the mixins instead.
- The o-colors and o-visual-effects dependencies have been bumped to the latest major. These will create bower conflicts which should be resolved by updating to the newest release of o-colors and o-visual-effects.