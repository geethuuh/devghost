CC = gcc
CFLAGS = -Wall -Wextra -O2 -Iinclude
TARGET = devghost

SRCS = src/main.c src/diagnostics.c src/ui.c src/executor.c
OBJS = $(SRCS:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) $(TARGET).exe
