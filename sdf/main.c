#include <png.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <float.h>

#define QUIET

char *color_type_string(int color_type) {
  switch (color_type) {
    case PNG_COLOR_TYPE_GRAY:
      return "PNG_COLOR_TYPE_GRAY";
    case PNG_COLOR_TYPE_GRAY_ALPHA:
      return "PNG_COLOR_TYPE_GRAY_ALPHA";
    case PNG_COLOR_TYPE_PALETTE:
      return "PNG_COLOR_TYPE_PALETTE";
    case PNG_COLOR_TYPE_RGB:
      return "PNG_COLOR_TYPE_RGB";
    case PNG_COLOR_TYPE_RGB_ALPHA:
      return "PNG_COLOR_TYPE_RGB_ALPHA";
    default:
      return "UNKNOWN_COLOR_TYPE";
  }
}

double find_nearest(int value, int from_column, int from_row, png_bytepp rows, int width, int height) {
  // We do a brute-force search of the entire bitmask for now, checking every
  // pixel. No need to optimize when we can run this overnight.
  double nearest = 1E6;
  int row;
  for (row = 0; row < height; ++row) {
    int column;
    for (column = 0; column < width; ++column) {
      if (((rows[row][column/8] >> (7-column%8)) & 0x01) == value) {
        double distance = sqrt((column - from_column)*(column - from_column) + (row - from_row)*(row - from_row));
        if (distance < nearest) {
          nearest = distance;
//          printf("Found new nearest distance %f\n", nearest);
        }
      }
    }
  }
#ifndef QUIET
  printf("Found nearest distance %f\n", nearest);
#endif
  return nearest;
}

int main(int argc, char **argv) {
  if (argc != 6) {
    printf("Need 5 arguments\n");
    return 1;
  }
  const char *input_file = argv[1];
  const char *output_file = argv[2];
  int output_width = atoi(argv[3]);
  int output_height = atoi(argv[4]);
  double spread = atof(argv[5]);

  FILE *fp = fopen(input_file, "rb");
  if (!fp) {
    return 1;
  }

  png_structp png_ptr = png_create_read_struct(
      PNG_LIBPNG_VER_STRING, (png_voidp)NULL, NULL, NULL);
  if (!png_ptr) {
    png_destroy_read_struct(&png_ptr, (png_infopp)NULL, (png_infopp)NULL);
    return 1;
  }

  png_infop info_ptr = png_create_info_struct(png_ptr);
  if (!info_ptr) {
    png_destroy_read_struct(&png_ptr, (png_infopp)NULL, (png_infopp)NULL);
    return 1;
  }

  png_infop end_ptr = png_create_info_struct(png_ptr);
  if (!end_ptr) {
    png_destroy_read_struct(&png_ptr, (png_infopp)NULL, (png_infopp)NULL);
    return 1;
  }

  png_init_io(png_ptr, fp);

  png_read_png(png_ptr, info_ptr, PNG_TRANSFORM_IDENTITY, NULL);

  png_bytepp row_pointers = png_get_rows(png_ptr, info_ptr);

  int input_width, input_height, bit_depth, color_type;

  input_width = png_get_image_width(png_ptr, info_ptr);
  input_height = png_get_image_height(png_ptr, info_ptr);
  bit_depth = png_get_bit_depth(png_ptr, info_ptr);
  color_type = png_get_color_type(png_ptr, info_ptr);

  // Max distance used in conjunction with the spread
  double max_distance = sqrt(input_width*input_width + input_height*input_height);

  printf("input_width: %d\ninput_height: %d\nbit_depth: %d\ncolor_type: %s\n",
      input_width, input_height, bit_depth, color_type_string(color_type));

  if (bit_depth != 1 || color_type != PNG_COLOR_TYPE_GRAY) {
    printf("Only bitmaps supported.");
    return 1;
  }

  // Print out the bits as ascii, for debugging
  /*
  {
    int y;
    for (y = 0; y < input_height; ++y) {
      int x;
      for (x = 0; x < input_width; ++x) {
        if ((row_pointers[y][x/8] >> (7-x%8)) & 0x01) {
          printf(" ");
        } else {
          printf("#");
        }
      }
      printf("\n");
    }
  }
  */

  // Allocate memory for the SDF we are generating
  unsigned int *sdf = malloc(4 * output_width * output_height);
  if (!sdf) {
    printf("Could not allocate memory for SDF!\n");
    return 1;
  }

  // Loop through the signed distance field values we want generated
  int sdf_row;
  for (sdf_row = 0; sdf_row < output_height; ++sdf_row) {
    int sdf_column;
    for (sdf_column = 0; sdf_column < output_width; ++sdf_column) {
      // Distribute the sampled pixels evenly; not very sophisticated
      int input_row = sdf_row * (input_height/output_height);
      int input_column = sdf_column * (input_width/output_width);
      int sampledValue = (row_pointers[input_row][input_column/8] >> (7-input_column%8)) & 0x01;
      // Look for the nearest pixel of opposite value
      double nearest_distance = find_nearest(!sampledValue, input_column, input_row, row_pointers, input_width, input_height);
      // Map the nearest distance between 0 and 255 and put it in the alpha
      // channel (and all the other channels)
      double normalized = nearest_distance / (spread*max_distance);
      normalized = (normalized > 1.0) ? 1.0 : normalized;
      unsigned char result;
      if (sampledValue) {
        // Interpolate between 128 and 255 for values inside the figure
        result = 255 - ((1.0 - normalized) * 127);
      } else {
        // Interpolate between 0 and 127 for values outside the figure
        result = (1.0 - normalized) * 127;
      }
      unsigned int result_int = 0;
      int i;
      for (i = 0; i < 4; ++i) {
        result_int |= (unsigned int)result << 8*i;
      }
      sdf[sdf_column%output_width + sdf_row*output_width] = result_int;
#ifndef QUIET
      printf("normalized: %f  pixel [%i][%i] value: %02x\n", normalized, sdf_column, sdf_row, result);
#endif
    }
  }


  // Free the png read resources
  fclose(fp);
  png_free_data(png_ptr, info_ptr, PNG_FREE_ALL, -1);
  png_destroy_read_struct(&png_ptr, (png_infopp)NULL, (png_infopp)NULL);

  // Write our results into the output png
  FILE *out_fp = fopen(output_file, "wb");
  if (!out_fp) {
    return 1;
  }

  png_structp write_ptr = png_create_write_struct (PNG_LIBPNG_VER_STRING, (png_voidp)NULL, NULL, NULL);
  if (!write_ptr) {
    return 1;
  }

  info_ptr = png_create_info_struct(write_ptr);
  if (!info_ptr) {
    png_destroy_write_struct(&write_ptr, (png_infopp)NULL);
    return 1;
  }

  png_init_io(write_ptr, out_fp);
  png_set_IHDR(write_ptr, info_ptr, output_width, output_height, 8, PNG_COLOR_TYPE_RGB_ALPHA, PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
  png_write_info(write_ptr, info_ptr);


  // TODO: Write the generated sdf data to the output png one row at a time
  int row;
  for (row = 0; row < output_height; ++row) {
    png_write_row(write_ptr, (png_const_bytep)(&(sdf[row*output_width])));
  }
  png_write_end(write_ptr, NULL);

  fclose(out_fp);
  png_free_data(write_ptr, info_ptr, PNG_FREE_ALL, -1);
  png_destroy_write_struct(&write_ptr, (png_infopp)NULL);
  free(sdf);
}
