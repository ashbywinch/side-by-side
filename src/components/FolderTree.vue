<template>
    <header>
        <nav class="navbar navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="#"></a>
                <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
                <span class="navbar-toggler-icon"></span>
                </button>
                <div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Texts:</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div class="offcanvas-body">
                    <a class="nav-link active" aria-current="page" href="#">Home</a>
                    <a class="nav-link" href="#">Features</a>
                    <a class="nav-link" href="#">Pricing</a>
                    <a class="nav-link" href="#">Pricing</a>
                    <a class="nav-link" href="#">Pricing</a>
                    <a class="nav-link" href="#">Pricing</a>
                    <a class="nav-link" href="#">Pricing</a>
                    <a class="nav-link" href="#">Pricing</a>
                </div>
                </div>
            </div>
        </nav>
    </header>

</template>

<script>

import index from '@/assets/index.json'

export default {
  name: 'FolderTree',   
  data() {
    return {
      index: index
    };
  },
};
</script>
