function  params = load_parameters()
params.plane_height = 1;
params.floor_size = 1;

params.project_offset = 0.5;

params.col_curve = [167,201,87]/255;
% params.col_curve = [0,0,0];
params.col_plane = [162,210,255]/255;
params.col_floor = [255, 175, 204]/255;
params.col_point = [239,35,60]/255;
params.col_handle = [255,195,0;
    72,149,239]/255;
params.col_decor = [78,49,100]/100;

params.linestyle_2D = '-';
params.alpha_plane = 0.2;
params.alpha_decor = 0.5;
params.size_line = 2;
params.size_handle = 1;
params.size_point = 50;
params.size_decor = 0.05;
params.num_samples = 100;



ifplot.curve = true;
ifplot.projection = true;

ifplot.handles = false;
ifplot.intersection = false;
ifplot.decoration = false;

params.ifplot = ifplot;
end