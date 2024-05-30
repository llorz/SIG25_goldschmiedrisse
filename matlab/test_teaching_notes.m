clc; clear; clf;
addpath("utils/");
%%
group1 = {'tn-3', 'tn-4', 'tn-3.v1', 'tn-4.v1', ...
    'tn-7', 'tn-9', 'U.XI.16', 'U.XI.21',...
    'U.XI.16.v1'};

num = ceil(length(group1)/2);
figure(3); clf;
for ii = 1:length(group1)
    subplot(2,num,ii); 
    cs = return_curves(group1{ii});
    cs.plot_2D_projection();
end

%%

t1 = [-0.2, 0.5];
t2 = [0.4,1];

anchor = [-t2; ...
   t1;
   t2];
anchor_label = [1,0,1]; 


p1 = [-0.2, -0.3];
p2 = [0.5, 0];
t = 0.5;
p3 = (1-t)*p1 + t*p2;
anchor = [p1; p3; p2];
anchor_label = [1,0,1];
reflect_pid = 3;
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    2, true, reflect_pid);


% anchor = [-0.5, 0;
%     -0.3, -0.5;
%     0.1, -0.2];
% anchor_label = [0,1,1];
% uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
%     2, true);

cs = CurveStructure();
cs.add_unit_curve(uc1);
% cs.add_unit_curve(uc2);
figure(2); clf;
cs.plot_2D_projection();


%%
cs = return_curves('tn-10');
figure(2); clf; 
cs.plot_2D_projection();