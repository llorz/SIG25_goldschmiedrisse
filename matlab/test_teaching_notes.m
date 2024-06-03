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
p1 = [0,1];
p2 = [sqrt(3)/2, -0.5];
p3 = [1.8,-0.8];
h = 3;
p4 = [0.4,h+0.2];
p5 = [0,h];
p6 = [3*sqrt(3)/2, 3/2];
p7 = [1, h-0.2];


anchor = [p1; p2];
anchor_label = [1,1];
anchor_constraints = [];
uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, false);


anchor = [p5; p6];
anchor_constraints = [0,-1; -0.8, 0];
anchor_label = [0,1];
uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, true);



anchor = [p1;p3;];
anchor_label = [1,1];
anchor_constraints = [1,0; 0,1;];
uc3 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, false);


anchor = [p3; p4];
anchor_label = [1,1];
anchor_constraints = [0,2; 0.2,0];
uc4 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, false);


anchor = [p5; p7];
anchor_label = [1,1];
anchor_constraints = [0.2,0; -0.2,0.2];
uc5 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, false);


cs = CurveStructure();
cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
cs.add_unit_curve(uc3);
cs.add_unit_curve(uc4);
cs.add_unit_curve(uc5);


figure(3); clf;
cs.plot_2D_projection();
axis on; grid on; axis equal;
%%
write_2D_drawings([filepath, cs.name, '.uc'], cs);
%%
for ii = 1:12
    cs = return_curves(['tn-',num2str(ii)]);
    % cs = return_curves('tn-1');
    figure(4); clf;
    cs.plot_2D_projection();

    filepath = '../2D_drawings/';
    write_2D_drawings([filepath, cs.name, '.uc'], cs);
end

% for name = {'tn-3.v1','tn-4.v1', 'U.XI.21', 'U.XI.16', 'U.XI.16.v1','U.XI.15',...
%         'U.XI.26', 'U.XI.23', 'U.XI.32', 'U.XI.31', 'U.XI.33','U.XI.19','U.XI.27'}
%     cs = return_curves(name{1});
%     figure(4); clf; 
%     cs.plot_2D_projection();
%     write_2D_drawings([filepath, cs.name, '.uc'], cs);
% 
% end
% fid = fopen([filepath, cs.name,'.uc'],'w');
% fprintf(fid, 'numCurves\t%d\n',length(cs.unit_curves));
% for ii = 1:length(cs.unit_curves)
%     uc = cs.unit_curves(ii);
%     cc = uc.unit_controlledCurve;
%     np = size(cc.anchor,1);
%     fprintf(fid, 'unitCurve\t%d\t%d\t%d\t%d\n', np, ...
%         uc.rotational_symmetry, uc.reflection_symmetry, uc.reflection_pid);
%     for jj = 1:np
%         fprintf(fid, 'ptPos\t%f\t%f\n', cc.anchor(jj,1), cc.anchor(jj,2));
%         if ~isempty(cc.anchor_constraints)
%             fprintf(fid, 'ptTan\t%f\t%f\n', cc.anchor_constraints(jj,1), cc.anchor_constraints(jj,2));
%         end
%         fprintf(fid, 'ptLab\t%d\n', cc.anchor_label(jj));
%     end
% end
% fclose(fid);
%%
filepath = '../2D_drawings/';
name = 'U.XI.26';
cs = read_2D_drawings([filepath, name, '.uc']);
figure(4); clf;
cs.plot_2D_projection();
