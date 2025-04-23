addpath("utils/");
addpath('utils_gp/');

filepath = '../data_2D_drawings/';

name = 'U.XI.25';
name = 'tn-12';
name = 'tn-1';
cs = read_2D_drawings([filepath, name, '.uc']);
cs = rescale_curve_structure(cs, 1);
cs.prepare_control_points();

figure(6); clf
cs.plot_curves(); axis off;