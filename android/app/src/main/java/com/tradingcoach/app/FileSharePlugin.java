package com.tradingcoach.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.List;

@CapacitorPlugin(name = "FileShare")
public class FileSharePlugin extends Plugin {

    @PluginMethod
    public void shareFile(PluginCall call) {
        String fileUri = call.getString("fileUri");
        String title = call.getString("title", "Compartir archivo");
        String dialogTitle = call.getString("dialogTitle", "Compartir");

        if (fileUri == null || fileUri.isEmpty()) {
            call.reject("fileUri is required");
            return;
        }

        try {
            // Convert file:// URI to content:// URI via FileProvider
            File file = new File(Uri.parse(fileUri).getPath());

            if (!file.exists()) {
                call.reject("File does not exist: " + fileUri);
                return;
            }

            Uri contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file);

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/json");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Grant URI permissions to ALL possible resolving activities
            // This is the key fix - granting permissions explicitly
            Intent chooser = Intent.createChooser(shareIntent, dialogTitle);

            List<ResolveInfo> resInfoList = getContext().getPackageManager()
                    .queryIntentActivities(chooser, PackageManager.MATCH_DEFAULT_ONLY);

            for (ResolveInfo resolveInfo : resInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                getContext().grantUriPermission(
                        packageName,
                        contentUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            // Also grant to the chooser activity itself (system UI)
            // This handles the Share Sheet preview
            List<ResolveInfo> chooserResInfoList = getContext().getPackageManager()
                    .queryIntentActivities(shareIntent, PackageManager.MATCH_DEFAULT_ONLY);

            for (ResolveInfo resolveInfo : chooserResInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                getContext().grantUriPermission(
                        packageName,
                        contentUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            getActivity().startActivity(chooser);
            call.resolve();

        } catch (Exception e) {
            call.reject("Error sharing file: " + e.getMessage(), e);
        }
    }
}
