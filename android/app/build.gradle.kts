plugins { id("com.android.application") }

android {
    namespace = "ru.pridecafe.menu"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.pridecafe.menu"
        minSdk = 24
        targetSdk = 34
        versionCode = 7
        versionName = "1.6.2"
    }

    signingConfigs {
        getByName("debug") {
            storeFile = file("../signing/pride-debug.p12")
            storePassword = "android"
            keyAlias = "pride_debug"
            keyPassword = "android"
        }
    }
    buildTypes {
        getByName("debug") { signingConfig = signingConfigs.getByName("debug") }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
