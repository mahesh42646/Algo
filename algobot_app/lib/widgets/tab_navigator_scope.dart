import 'package:flutter/material.dart';

class TabNavigatorScope extends InheritedWidget {
  const TabNavigatorScope({
    super.key,
    required this.switchToTab,
    required super.child,
  });

  final void Function(int index) switchToTab;

  static TabNavigatorScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<TabNavigatorScope>();
  }

  @override
  bool updateShouldNotify(TabNavigatorScope oldWidget) {
    return switchToTab != oldWidget.switchToTab;
  }
}
