% test0723: split one curve into multiple

P = [0.3,-0.2, 0;
    0, 1, 1];

p1 = P(1,:);
p2 = P(2,:);



p_start = [0,0];
p_end = [1,1];
t_start = [0,1];
t_end = [0,-1];

figure(3); clf
func_height = fit_bezier_curve([p1(3), 0], [p2(3), 1], t_start, t_end, true);
bz_height_ori = [p1(3), 0;
    p2(3), 1;
    t_start;
    t_end];

figure(4); clf;
func_proj = fit_bezier_curve(p1(1:2), p2(1:2), [0,0], [0,0], true);


%%
p_t = [0.2; 0.5; 0.9];
% p_t = 0.9;
p_label = [4; 3; 4];


figure(22); clf;
splited_curve = split_bezier_curve(bz_height_ori, p_t, true)

