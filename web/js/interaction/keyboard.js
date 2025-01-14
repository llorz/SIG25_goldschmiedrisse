import * as THREE from 'three';

import { finish_curve, edit_mode, EditMode, delete_selected_curve, mode } from '../state/state';
import { abort_new_face, finish_face } from '../view/add_face_mode';
import { selected_obj } from './mouse';

addEventListener('keydown', (event) => {
  if (event.key == "Escape") {
    if (edit_mode == EditMode.new_curve) {
      finish_curve();
    } else if (edit_mode == EditMode.new_face) {
      abort_new_face();
    }
  } else if (event.key == "Delete" || event.key == "Backspace") {
    if (edit_mode == EditMode.new_curve) {
      finish_curve();
    }
    delete_selected_curve(selected_obj);
  } else if (event.key == 'Enter') {
    if (edit_mode == EditMode.new_face) {
      finish_face();
    }
  }
});