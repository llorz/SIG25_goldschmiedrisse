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
name = 'U.XI.24';
cs = read_2D_drawings([filepath, name, '.uc']);
% cs = rescale_curve_structure(cs, 2)
figure(4); clf;
cs.plot_2D_projection;


figure(5);clf;
cs.plot_3D_structure();


