sdf = ../sdf/sdf
# NOTE: The ../sdf/sdf program I wrote assumes square images, and uses the
# width of the image in the spread ratio. I compensate for that in some of the
# spreads shown here.
sdf_near_ball_args = 512 256 .1
sdf_far_ball_args = 256 128 .7
sdf_text_args = 1024 128 .2
sdf_short_text_args = 512 128 .1

all: billiard_ball_1_sdf_near.png billiard_ball_1_sdf_far.png billiard_ball_2_sdf_near.png billiard_ball_2_sdf_far.png billiard_ball_3_sdf_near.png billiard_ball_3_sdf_far.png billiard_ball_4_sdf_near.png billiard_ball_4_sdf_far.png billiard_ball_5_sdf_near.png billiard_ball_5_sdf_far.png billiard_ball_6_sdf_near.png billiard_ball_6_sdf_far.png billiard_ball_7_sdf_near.png billiard_ball_7_sdf_far.png billiard_ball_8_sdf_near.png billiard_ball_8_sdf_far.png billiard_ball_9_sdf_near.png billiard_ball_9_sdf_far.png billiard_ball_10_sdf_near.png billiard_ball_10_sdf_far.png billiard_ball_11_sdf_near.png billiard_ball_11_sdf_far.png billiard_ball_12_sdf_near.png billiard_ball_12_sdf_far.png billiard_ball_13_sdf_near.png billiard_ball_13_sdf_far.png billiard_ball_14_sdf_near.png billiard_ball_14_sdf_far.png billiard_ball_15_sdf_near.png billiard_ball_15_sdf_far.png next_ball_text_sdf.png replay_text_sdf.png foul_text_sdf.png player_one_text_sdf.png player_two_text_sdf.png player_one_wins_text_sdf.png player_two_wins_text_sdf.png press_spacebar_text_sdf.png

# Generate SDF textures for near shots (especially in replays)
billiard_ball_1_sdf_near.png: billiard_ball_1_bitmask.png
	$(sdf) ./billiard_ball_1_bitmask.png ./billiard_ball_1_sdf_near.png $(sdf_near_ball_args)
billiard_ball_2_sdf_near.png: billiard_ball_2_bitmask.png
	$(sdf) ./billiard_ball_2_bitmask.png ./billiard_ball_2_sdf_near.png $(sdf_near_ball_args)
billiard_ball_3_sdf_near.png: billiard_ball_3_bitmask.png
	$(sdf) ./billiard_ball_3_bitmask.png ./billiard_ball_3_sdf_near.png $(sdf_near_ball_args)
billiard_ball_4_sdf_near.png: billiard_ball_4_bitmask.png
	$(sdf) ./billiard_ball_4_bitmask.png ./billiard_ball_4_sdf_near.png $(sdf_near_ball_args)
billiard_ball_5_sdf_near.png: billiard_ball_5_bitmask.png
	$(sdf) ./billiard_ball_5_bitmask.png ./billiard_ball_5_sdf_near.png $(sdf_near_ball_args)
billiard_ball_6_sdf_near.png: billiard_ball_6_bitmask.png
	$(sdf) ./billiard_ball_6_bitmask.png ./billiard_ball_6_sdf_near.png $(sdf_near_ball_args)
billiard_ball_7_sdf_near.png: billiard_ball_7_bitmask.png
	$(sdf) ./billiard_ball_7_bitmask.png ./billiard_ball_7_sdf_near.png $(sdf_near_ball_args)
billiard_ball_8_sdf_near.png: billiard_ball_8_bitmask.png
	$(sdf) ./billiard_ball_8_bitmask.png ./billiard_ball_8_sdf_near.png $(sdf_near_ball_args)
billiard_ball_9_sdf_near.png: billiard_ball_9_bitmask.png
	$(sdf) ./billiard_ball_9_bitmask.png ./billiard_ball_9_sdf_near.png $(sdf_near_ball_args)
billiard_ball_10_sdf_near.png: billiard_ball_10_bitmask.png
	$(sdf) ./billiard_ball_10_bitmask.png ./billiard_ball_10_sdf_near.png $(sdf_near_ball_args)
billiard_ball_11_sdf_near.png: billiard_ball_11_bitmask.png
	$(sdf) ./billiard_ball_11_bitmask.png ./billiard_ball_11_sdf_near.png $(sdf_near_ball_args)
billiard_ball_12_sdf_near.png: billiard_ball_12_bitmask.png
	$(sdf) ./billiard_ball_12_bitmask.png ./billiard_ball_12_sdf_near.png $(sdf_near_ball_args)
billiard_ball_13_sdf_near.png: billiard_ball_13_bitmask.png
	$(sdf) ./billiard_ball_13_bitmask.png ./billiard_ball_13_sdf_near.png $(sdf_near_ball_args)
billiard_ball_14_sdf_near.png: billiard_ball_14_bitmask.png
	$(sdf) ./billiard_ball_14_bitmask.png ./billiard_ball_14_sdf_near.png $(sdf_near_ball_args)
billiard_ball_15_sdf_near.png: billiard_ball_15_bitmask.png
	$(sdf) ./billiard_ball_15_bitmask.png ./billiard_ball_15_sdf_near.png $(sdf_near_ball_args)

# Generate SDF textures for far shots (especially in interactive mode)
billiard_ball_1_sdf_far.png: billiard_ball_1_bitmask.png
	$(sdf) ./billiard_ball_1_bitmask.png ./billiard_ball_1_sdf_far.png $(sdf_far_ball_args)
billiard_ball_2_sdf_far.png: billiard_ball_2_bitmask.png
	$(sdf) ./billiard_ball_2_bitmask.png ./billiard_ball_2_sdf_far.png $(sdf_far_ball_args)
billiard_ball_3_sdf_far.png: billiard_ball_3_bitmask.png
	$(sdf) ./billiard_ball_3_bitmask.png ./billiard_ball_3_sdf_far.png $(sdf_far_ball_args)
billiard_ball_4_sdf_far.png: billiard_ball_4_bitmask.png
	$(sdf) ./billiard_ball_4_bitmask.png ./billiard_ball_4_sdf_far.png $(sdf_far_ball_args)
billiard_ball_5_sdf_far.png: billiard_ball_5_bitmask.png
	$(sdf) ./billiard_ball_5_bitmask.png ./billiard_ball_5_sdf_far.png $(sdf_far_ball_args)
billiard_ball_6_sdf_far.png: billiard_ball_6_bitmask.png
	$(sdf) ./billiard_ball_6_bitmask.png ./billiard_ball_6_sdf_far.png $(sdf_far_ball_args)
billiard_ball_7_sdf_far.png: billiard_ball_7_bitmask.png
	$(sdf) ./billiard_ball_7_bitmask.png ./billiard_ball_7_sdf_far.png $(sdf_far_ball_args)
billiard_ball_8_sdf_far.png: billiard_ball_8_bitmask.png
	$(sdf) ./billiard_ball_8_bitmask.png ./billiard_ball_8_sdf_far.png $(sdf_far_ball_args)
billiard_ball_9_sdf_far.png: billiard_ball_9_bitmask.png
	$(sdf) ./billiard_ball_9_bitmask.png ./billiard_ball_9_sdf_far.png $(sdf_far_ball_args)
billiard_ball_10_sdf_far.png: billiard_ball_10_bitmask.png
	$(sdf) ./billiard_ball_10_bitmask.png ./billiard_ball_10_sdf_far.png $(sdf_far_ball_args)
billiard_ball_11_sdf_far.png: billiard_ball_11_bitmask.png
	$(sdf) ./billiard_ball_11_bitmask.png ./billiard_ball_11_sdf_far.png $(sdf_far_ball_args)
billiard_ball_12_sdf_far.png: billiard_ball_12_bitmask.png
	$(sdf) ./billiard_ball_12_bitmask.png ./billiard_ball_12_sdf_far.png $(sdf_far_ball_args)
billiard_ball_13_sdf_far.png: billiard_ball_13_bitmask.png
	$(sdf) ./billiard_ball_13_bitmask.png ./billiard_ball_13_sdf_far.png $(sdf_far_ball_args)
billiard_ball_14_sdf_far.png: billiard_ball_14_bitmask.png
	$(sdf) ./billiard_ball_14_bitmask.png ./billiard_ball_14_sdf_far.png $(sdf_far_ball_args)
billiard_ball_15_sdf_far.png: billiard_ball_15_bitmask.png
	$(sdf) ./billiard_ball_15_bitmask.png ./billiard_ball_15_sdf_far.png $(sdf_far_ball_args)

# Generate SDF textures for text in the menu
next_ball_text_sdf.png: next_ball_text_bitmask.png
	$(sdf) ./next_ball_text_bitmask.png ./next_ball_text_sdf.png $(sdf_text_args)
replay_text_sdf.png: replay_text_bitmask.png
	$(sdf) ./replay_text_bitmask.png ./replay_text_sdf.png $(sdf_text_args)
foul_text_sdf.png: foul_text_bitmask.png
	$(sdf) ./foul_text_bitmask.png ./foul_text_sdf.png $(sdf_short_text_args)
player_one_text_sdf.png: player_one_text_bitmask.png
	$(sdf) ./player_one_text_bitmask.png ./player_one_text_sdf.png $(sdf_text_args)
player_two_text_sdf.png: player_two_text_bitmask.png
	$(sdf) ./player_two_text_bitmask.png ./player_two_text_sdf.png $(sdf_text_args)
player_one_wins_text_sdf.png: player_one_wins_text_bitmask.png
	$(sdf) ./player_one_wins_text_bitmask.png ./player_one_wins_text_sdf.png $(sdf_text_args)
player_two_wins_text_sdf.png: player_two_wins_text_bitmask.png
	$(sdf) ./player_two_wins_text_bitmask.png ./player_two_wins_text_sdf.png $(sdf_text_args)
press_spacebar_text_sdf.png: press_spacebar_text_bitmask.png
	$(sdf) ./press_spacebar_text_bitmask.png ./press_spacebar_text_sdf.png $(sdf_text_args)

# Gimp doesn't really know how to store a .png with 1 bit of depth, so we use
# ImageMagick to convert it
billiard_ball_1_bitmask.png: 
	convert billiard_ball_1_mask.png -depth 1 -type Grayscale billiard_ball_1_bitmask.png
billiard_ball_2_bitmask.png: 
	convert billiard_ball_2_mask.png -depth 1 -type Grayscale billiard_ball_2_bitmask.png
billiard_ball_3_bitmask.png: 
	convert billiard_ball_3_mask.png -depth 1 -type Grayscale billiard_ball_3_bitmask.png
billiard_ball_4_bitmask.png: 
	convert billiard_ball_4_mask.png -depth 1 -type Grayscale billiard_ball_4_bitmask.png
billiard_ball_5_bitmask.png: 
	convert billiard_ball_5_mask.png -depth 1 -type Grayscale billiard_ball_5_bitmask.png
billiard_ball_6_bitmask.png: 
	convert billiard_ball_6_mask.png -depth 1 -type Grayscale billiard_ball_6_bitmask.png
billiard_ball_7_bitmask.png: 
	convert billiard_ball_7_mask.png -depth 1 -type Grayscale billiard_ball_7_bitmask.png
billiard_ball_8_bitmask.png: 
	convert billiard_ball_8_mask.png -depth 1 -type Grayscale billiard_ball_8_bitmask.png
billiard_ball_9_bitmask.png: 
	convert billiard_ball_9_mask.png -depth 1 -type Grayscale billiard_ball_9_bitmask.png
billiard_ball_10_bitmask.png: 
	convert billiard_ball_10_mask.png -depth 1 -type Grayscale billiard_ball_10_bitmask.png
billiard_ball_11_bitmask.png: 
	convert billiard_ball_11_mask.png -depth 1 -type Grayscale billiard_ball_11_bitmask.png
billiard_ball_12_bitmask.png: 
	convert billiard_ball_12_mask.png -depth 1 -type Grayscale billiard_ball_12_bitmask.png
billiard_ball_13_bitmask.png: 
	convert billiard_ball_13_mask.png -depth 1 -type Grayscale billiard_ball_13_bitmask.png
billiard_ball_14_bitmask.png: 
	convert billiard_ball_14_mask.png -depth 1 -type Grayscale billiard_ball_14_bitmask.png
billiard_ball_15_bitmask.png: 
	convert billiard_ball_15_mask.png -depth 1 -type Grayscale billiard_ball_15_bitmask.png
next_ball_text_bitmask.png: 
	convert next_ball_text_mask.png -depth 1 -type Grayscale next_ball_text_bitmask.png
replay_text_bitmask.png: 
	convert replay_text_mask.png -depth 1 -type Grayscale replay_text_bitmask.png
foul_text_bitmask.png: 
	convert foul_text_mask.png -depth 1 -type Grayscale foul_text_bitmask.png
player_one_text_bitmask.png: 
	convert player_one_text_mask.png -depth 1 -type Grayscale player_one_text_bitmask.png
player_two_text_bitmask.png: 
	convert player_two_text_mask.png -depth 1 -type Grayscale player_two_text_bitmask.png
player_one_wins_text_bitmask.png: 
	convert player_one_wins_text_mask.png -depth 1 -type Grayscale player_one_wins_text_bitmask.png
player_two_wins_text_bitmask.png: 
	convert player_two_wins_text_mask.png -depth 1 -type Grayscale player_two_wins_text_bitmask.png
press_spacebar_text_bitmask.png: 
	convert press_spacebar_text_mask.png -depth 1 -type Grayscale press_spacebar_text_bitmask.png

.PHONY: clean
clean:
	rm -f *_bitmask.png *sdf_far.png *sdf_near.png *sdf.png
