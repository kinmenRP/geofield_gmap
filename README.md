# geofield_gmap
The Geofield Gmap module for DrupalGap

Consider applying this patch to the geofield_gmap module in Drupal:

```
cd www/sites/all/modules
rm -rf geofield_gmap
drush dl geofield_gmap --dev
cd geofield_gmap
wget https://www.drupal.org/files/issues/2424803-5-default_zoom_center.patch
patch -p1 < 2424803-5-default_zoom_center.patch
```

This patch allows you to set a default lat/lon and zoom level for the widget.

