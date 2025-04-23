# Computational Modeling of Gothic Microarchitecture
This is an example code for our SIGGRAPH 2025 paper "Computational Modeling of Gothic Microarchitecture", by [Aviv Segall](https://igl.ethz.ch/people/), [Jing Ren](https://ren-jing.com/), [Martin Schwarz](https://kunstgeschichte.philhist.unibas.ch/de/personen/martin-schwarz/) and [Olga Sorkine-Hornung](https://igl.ethz.ch/people/sorkine). 

More details can be found at: [[web demo]](), [[project page]](https://igl.ethz.ch/projects/gothic/) | [[paper]]() | [[suppl. video]](https://youtu.be/RmQTWPMZuUU)  | [[slides]]() 


## Gothic Microarchitecture
The term Gothic microarchitecture, as used by art historians, refers to a phenomenon widely observed in the design of late medieval European art: sculptural works that emulate the forms and structural composition of large-scale Gothic architecture.
This design phenomenon reached its apogee in the 15th century, particularly (if not exclusively) manifested in religious contexts, above all in church furnishings and liturgical objects. See below for some examples.
| Main Altarpiece <br> 1502, *wood* <br> Magdalensberg Church, Austria | Sacrament House <br> early 15th cenury, *lime stone* <br> Parish Church, Austria| Tower Monstrance <br> 1490, *silver* <br> Historisches Museum Basel, Swiss|
| :---: | :---: | :---: |
| <img src="./fig/eg1.jpg" style=" height=300 " /> |  <img src="./fig/eg2.jpg"   style=" height=300 " />  |  <img src="./fig/eg3.jpg" style=" height=300 " />   |

The design and construction processes of Gothic microarchitecture were *never* formally documented, but instead passed down through master-appretice relationships, so that much of this knowledge has been lost :(

## Basler Goldschmiedrisse 
The Basel goldsmith drawings (“Basler Goldschmiedrisse”), a collection of over 200 late 15th-century design drawings from the Upper Rhine region, provide a rare glimpse into the workshop practices of Gothic artisans. This collection consists of *unpaired* 2D drawings, including top-view and side-view projections of Gothic microarchitecture, featuring nested curve networks *without annotations* or explicitly articulated design principles. See below for some examples. 

| Inv.U.XI.18 | Inv.U.XI.19 | Inv.U.XI.24 |Inv.U.XI.28| Inv.U.XI.31 | Inv.U.XI.35|
|----------|----------|----------|----------|----------|----------|
| <img src="./fig/uxi18.jpg" style=" height=150 width: auto;" /> | <img src="./fig/uxi19.jpg" style=" height=150 width: auto;"  /> | <img src="./fig/uxi24.jpg" style=" height=150 width: auto;"  /> | <img src="./fig/uxi28.jpg" style=" height=150 width: auto;"  /> | <img src="./fig/uxi31.jpg" style=" height=150 width: auto;"  /> | <img src="./fig/uxi35.jpg" style=" height=150 width: auto;"  /> | 

| Inv.U.XI.46      | Inv.U.XI.86   |  Inv.U.XI.94   |
| :---: | :---: | :---: |
| <img src="./fig/uxi46.jpg" style=" height=220 width: auto;"  /> | <img src="./fig/uxi86.jpg" style=" height=220 width: auto;"  /> |<img src="./fig/uxi94.jpg" style=" height=220 width: auto;"  /> |

These images are in the public domain and were accessed via [Kunstmuseum Basel’s online collection](https://download.kunstmuseumbasel.ch/#/). The original images can be retrieved by searching with the inventory ID or the keyword "Basler Goldschmiedrisse".

### Design process
Somewhat counter to modern intuition, the above top-view schemes represent the *initial stage* of the Gothic design process. Starting with the ground plan allowed the designer to define the rotational and reflectional symmetries that shaped the overall structural configuration. The next step in the design process involved generating a side view or elevation of the structure. Medieval German sources revealingly refer to this stage as *“Auszug”* (extraction process). This term denotes the extrusion of the design along the $z$-axis, yielding the side view of a given ground plan. 
Certain geometry-based rules and formal constraints guided the translation of the ground plan into an elevation, but the few historical treatises in existence supply little information on the exact procedure

Today, understanding these 2D top view drawings and reconstructing the 3D objects they represent has long posed a significant challenge due to the lack of documentation and the complexity of the designs. 

### Teaching Sheet (Lehrblatt)

<div style="text-align: center;">
  <img src="./fig/teaching_notes_full.jpg" alt="Description" style="margin: 0 auto; max-width: 100%;" />
  <p><em>The so-called Lehrblatt or teaching sheet (ca. 1500, ink on paper, 19.8 x 30.2 cm, Basel, Kunstmuseum): It may have served the instruction of apprentices in the workshop. For each top view drawing, shown in the 2nd and 4th rows, the corresponding front views are also illustrated.</em></p>
</div>

**This teaching sheet serves as our Rosetta stone, providing the following insights**:
1. **Marked points** on the top view **are ground points** with zero height in its corresponding side view
2. Endpoints have **vertical tangents**
3. Side view resembles **ogee arc**, and the **point with reverse curvatures (PRC)** in the side view is an **intersection point** in the top view
See illustrative explanations for each of the above observations, demonstrated through two examples from the teaching sheet:

| observation 1 | observation 2| observation 3 | 
| :---: | :---: | :---: |
| <img src="./fig/tn_ob1.png" style=" height=300 width: auto;"  /> | <img src="./fig/tn_ob2.png" tyle=" height=300 width: auto;" /> |<img src="./fig/tn_ob3.png" tyle=" height=300 width: auto;" /> |




## Our contributions 
1. We formulate the Gothic microarchitecture modeling problem as reconstructing 3D curve networks from given top view projections, which may originate from digitized historical drawings or user-provided sketches.
2. We formalize the design space for Gothic microarchitecture, incorporating positional and tangential constraints to ensure that the side view resembles the ogee arches–an important characteristic we observe in historical drawings and physical artifacts. Our curve parameterization enables interactive editing in the side view while maintaining a fixed top view, ensuring that all edits remain within the defined design space.
3. We demonstrate that our method reliably and faithfully reproduces 3D Gothic microarchitecture from the Basel goldsmith drawings, maintaining consistency with the style and features of Gothic artistic products, as verified by art historians.
4. Our formulation can be interpreted as a simple yet expressive modeling language for curve-dominant architecture: using basic curves and specified symmetries, multi-layered and intricate structures can be created from a single drawing. This approach extends beyond modeling Gothic microarchitecture and can be applied in a broader context, such as free-form architectural design.

In the repository, we provide the MATLAB prototye and web implemantation. You can find the web interactive user interface [here]().

## Comments
### Acknowledgements
<div style="text-align: center;">
  <img src="./fig/2dino.png" alt="Description" style="margin: 0 auto; max-width: 100%;" />
</div>

The authors express gratitude to the anonymous reviewers for their valuable feedback. 
Special thanks to ***Marcel Padilla*** for his spiritual guidance and to ***Ningfeng Zhou*** for proofreading.
The authors also extend their thanks to ***all IGL members*** for their time and support. 
This work was supported in part by the ERC Consolidator Grant No. 101003104 (MYCLOTH).

### Contact
Please let us know (aviv.segall, jing.ren@inf.ethz.ch) if you have any question regarding the algorithms/paper or you find any bugs in the code ε-(´∀｀; )
This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/). For any commercial uses or derivatives, please contact us (aviv.segall, jing.ren, sorkine, @inf.ethz.ch). [![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

