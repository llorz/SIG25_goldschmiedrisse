import * as THREE from 'three';

import { finish_curve, edit_mode, EditMode } from '../state/state';

addEventListener('keydown', (event) => {
  if (event.key == "Escape") {
    if (edit_mode == EditMode.new_curve)
      finish_curve();
  }
});