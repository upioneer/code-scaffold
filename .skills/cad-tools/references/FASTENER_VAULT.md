# Code Scaffold Standard Component and Fastener Vault

This document provides standardized engineering tables for mechanical hardware integration in parametric CAD solids : metric clearance holes, heat set brass inserts, ball bearings, and counterbores.

---

## 1. ISO Metric Fastener Clearances

Standard through-hole diameters for metric socket head cap screws (DIN 912 / ISO 4762) across three fit classes:

| Fastener | Close Fit (mm) | Normal Fit (mm) | Loose Fit (mm) | Tap Drill (mm) | C-Bore Dia (mm) | C-Bore Depth (mm) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M2** | 2.2 | 2.4 | 2.6 | 1.60 | 4.4 | 2.2 |
| **M2.5** | 2.7 | 2.9 | 3.1 | 2.05 | 5.0 | 2.7 |
| **M3** | 3.2 | 3.4 | 3.6 | 2.50 | 6.0 | 3.3 |
| **M4** | 4.3 | 4.5 | 4.8 | 3.30 | 7.5 | 4.4 |
| **M5** | 5.3 | 5.5 | 5.8 | 4.20 | 9.0 | 5.4 |
| **M6** | 6.4 | 6.6 | 7.0 | 5.00 | 11.0 | 6.5 |
| **M8** | 8.4 | 9.0 | 10.0 | 6.80 | 14.5 | 8.5 |
| **M10** | 10.5 | 11.0 | 12.0 | 8.50 | 17.5 | 10.5 |

* **Close Fit:** Recommended for precision alignment pins and dowels where play must be minimized.
* **Normal Fit:** Standard engineering practice for general assembly clearance.
* **Loose Fit:** Recommended when mating multiple parallel hole patterns subject to thermal expansion or looser fabrication tolerances.

---

## 2. Heat-Set Brass Threaded Inserts (Additive Manufacturing)

Standard straight and tapered knurled brass inserts for thermoplastic parts (PLA, PETG, ABS, PA12):

| Thread Size | Outer Diameter (mm) | Insert Length (mm) | Recommended Hole Top Dia (mm) | Draft Angle (deg) | Min Wall Around Boss (mm) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M2 Short** | 3.2 | 3.0 | 3.1 | 8.0 | 1.2 |
| **M2.5 Standard** | 4.2 | 4.0 | 4.0 | 8.0 | 1.5 |
| **M3 Standard** | 4.6 | 4.0 | 4.4 | 8.0 | 1.6 |
| **M3 Long** | 4.6 | 5.7 | 4.4 | 8.0 | 1.8 |
| **M4 Standard** | 6.3 | 5.8 | 6.0 | 8.0 | 2.0 |
| **M5 Standard** | 7.1 | 7.1 | 6.8 | 8.0 | 2.4 |

### Design Best Practices for Insert Bosses
* Always add a 0.5 mm lead-in counterbore chamfer to locate the insert before thermal iron engagement.
* Minimum wall thickness around the insert boss must be at least 40% of the insert diameter to withstand hoop stresses during expansion.
* Leave a bottom well clearance of at least 1.0 mm beneath the insert so the screw tip does not bottom out.

---

## 3. Miniature Deep-Groove Ball Bearings

Standard metric rotary bearings commonly integrated into robotics, drone arms, and motion systems:

| Bearing Code | Bore ID (mm) | Outer OD (mm) | Width B (mm) | Press-Fit Bore (mm) | Slip-Fit Bore (mm) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **608 (Skate)** | 8.00 | 22.00 | 7.00 | 21.96 | 22.04 |
| **688 (Slim)** | 8.00 | 16.00 | 5.00 | 15.96 | 16.03 |
| **625** | 5.00 | 16.00 | 5.00 | 15.96 | 16.03 |
| **624** | 4.00 | 13.00 | 5.00 | 12.97 | 13.03 |
| **MR105** | 5.00 | 10.00 | 4.00 | 9.97 | 10.03 |

* **Press-Fit (Interference Fit):** Bearing outer ring is locked stationary in the housing bore.
* **Slip-Fit (Transition Fit):** Allows manual insertion with retaining snap rings or shoulders.
