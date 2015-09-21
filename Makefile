all: common

common: sdf
	cd common && $(MAKE)

.PHONY: sdf
sdf:
	cd sdf && $(MAKE)

.PHONY: clean
clean:
	make -C common clean
	make -C sdf clean
