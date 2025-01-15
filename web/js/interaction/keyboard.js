import * as THREE from 'three';

import { finish_curve, edit_mode, EditMode, delete_selected_curve, mode } from '../state/state';
import { abort_new_face, finish_face } from '../view/add_face_mode';
import { selected_obj } from './mouse';
import { accept_edit_decoration_point, cancel_edit_decoration_point, delete_decoration_point, edit_decoration_point } from './edit_decoration_point';

addEventListener('keydown', (event) => {
  if (event.key == "Escape") {
    if (edit_mode == EditMode.new_curve) {
      finish_curve();
    } else if (edit_mode == EditMode.new_face) {
      abort_new_face();
    } else if (edit_mode == EditMode.edit_decoration_point) {
      cancel_edit_decoration_point();
    }
  } else if (event.key == "Delete" || event.key == "Backspace") {
    if (edit_mode == EditMode.new_curve) {
      finish_curve();
    } else if (edit_mode == EditMode.edit_decoration_point) {
      delete_decoration_point();
    }
    delete_selected_curve(selected_obj);
  } else if (event.key == 'Enter') {
    if (edit_mode == EditMode.new_face) {
      finish_face();
    } else if (edit_mode == EditMode.edit_decoration_point) {
      accept_edit_decoration_point();
    }
  } else if (event.key == 'd' && selected_obj && selected_obj.type == 'unit_curve') {
    edit_decoration_point();
  }
});