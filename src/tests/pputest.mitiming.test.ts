import { testPPURomWithImage } from './testutil';
import { test } from 'vitest'

const vblNMITimingRoot = 'nes-test-roms/vbl_nmi_timing/';

test('VBL NMI Timing - Frame basics', () => testPPURomWithImage(vblNMITimingRoot + '1.frame_basics.nes', 'nes-test-images/vbl_nmi_timing-1.frame_basics.nes.png', 178));
test('VBL NMI Timing - VBL Timing', () => testPPURomWithImage(vblNMITimingRoot + '2.vbl_timing.nes', 'nes-test-images/vbl_nmi_timing-2.vbl_timing.nes.png', 155));
test('VBL NMI Timing - Even/Odd frames', () => testPPURomWithImage(vblNMITimingRoot + '3.even_odd_frames.nes', 'nes-test-images/vbl_nmi_timing-3.even_odd_frames.nes.png', 95));
test('VBL NMI Timing - VBL Clear Timing', () => testPPURomWithImage(vblNMITimingRoot + '4.vbl_clear_timing.nes', 'nes-test-images/vbl_nmi_timing-4.vbl_clear_timing.nes.png', 125));
test('VBL NMI Timing - NMI Suppression', () => testPPURomWithImage(vblNMITimingRoot + '5.nmi_suppression.nes', 'nes-test-images/vbl_nmi_timing-5.nmi_suppression.nes.png', 185));
test('VBL NMI Timing - NMI Disable', () => testPPURomWithImage(vblNMITimingRoot + '6.nmi_disable.nes', 'nes-test-images/vbl_nmi_timing-6.nmi_disable.nes.png', 105));
test('VBL NMI Timing - NMI Timing', () => testPPURomWithImage(vblNMITimingRoot + '7.nmi_timing.nes', 'nes-test-images/vbl_nmi_timing-7.nmi_timing.nes.png', 105));
