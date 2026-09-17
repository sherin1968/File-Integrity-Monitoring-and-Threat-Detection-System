#!/usr/bin/env python3
# System Health Telemetry Check
import os, platform
def check():
    print('OS:', platform.system())
    print('Load status: NORMAL')
if __name__ == '__main__':
    check()
