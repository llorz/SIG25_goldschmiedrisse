clc; clear; clf;
addpath("utils/");
%% plot all examples in the teaching notes
figure(1); clf;
for ii = 1:12
    subplot(2, 6, ii);
    cs = return_curves(['tn-',num2str(ii)]);
    cs.plot_2D_projection();
end
%%
group1 = {'tn-3', 'tn-4', 'tn-3.v1', 'tn-4.v1', ...
    'tn-7', 'tn-9', 'U.XI.16', 'U.XI.21',...
    'U.XI.16.v1'};

num = ceil(length(group1)/2);
figure(2); clf;
for ii = 1:length(group1)
    subplot(2,num,ii);
    cs = return_curves(group1{ii});
    cs.plot_2D_projection();
end


%%
p1 = [-0.5, 0.5];
    p2 = [0.8, 0.3];

    anchor = [-p2; ...
        p1;];
    anchor_label = [1,0];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    acnhor = [p1; p2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);
    cs = CurveStructure('tn-5');
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);

    figure(1); clf;
    cs.prepare_control_points();
    cs.plot_curves()

return

%%
filepath = '../data_2D_drawings/';
write_2D_drawings([filepath, cs.name, '.uc'], cs);
%%
% for ii = 1:12
%     cs = return_curves(['tn-',num2str(ii)]);
%     % cs = return_curves('tn-1');
%     figure(4); clf;
%     cs.plot_2D_projection();
%
%     filepath = '../data_2D_drawings/';
%     write_2D_drawings([filepath, cs.name, '.uc'], cs);
% end
% 
% for name = {'tn-3.v1','tn-4.v1', 'U.XI.21', 'U.XI.16', 'U.XI.16.v1','U.XI.15',...
%         'U.XI.26', 'U.XI.23', 'U.XI.32', 'U.XI.31', 'U.XI.33','U.XI.19','U.XI.27', 'U.XI.35'}
%     cs = return_curves(name{1});
%     figure(4); clf;
%     cs.plot_2D_projection();
%     write_2D_drawings([filepath, cs.name, '.uc'], cs);
% 
% end

%%
filepath = '../data_2D_drawings/';
name = 'tn-11';
name = 'U.XI.30';

name = 'tn-8';

name = 'U.XI.15';
name = 'U.XI.18';
name = 'tn-10';
name = 'U.XI.29'
cs = read_2D_drawings([filepath, name, '.uc']);
cs = rescale_curve_structure(cs, 1.5);
cs.prepare_control_points();

figure(6); clf
cs.plot_curves(); axis off;
%%
func_normv = @(vec) vec/norm(vec);
curve = cs.curves(1);
t = 0.5;
eps = 0.1;
p1 = curve.fittedCurve(t);
p2 = curve.fittedCurve(t+eps);



n = func_normv(cross([p2(1:2) - p1(1:2),0], [0,0,1]));

u = func_normv(cross(n,curve.fittedCurveTangent(t)));




pos = p1 + 0.1*[1,1;
    1,-1;
    -1,-1;
    -1,1]*[u; n];

%%
figure(6); hold on;
fill3(pos(:,1), pos(:,2), pos(:,3),'red')


%%
p_start = [0,0];
p_end = [1,1];
t_start = [0,1];
t_end = [0,-1];
t_start = 0.1*(p_end-p_start);
t_end = 0.1*(p_start-p_end);

figure(3); clf
fit_bezier_curve(p_start, p_end, t_start, t_end, true);
%%
p = uc.unit_controlledCurve.anchor;
figure(4);
plot(uc);
% plot(p(:,1), p(:,2))
%%

