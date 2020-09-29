<template>
  <div class="home">
    <header style="background-color: #111;" class="bg-gray-900 h-48 pl-12 pt-8">
      <div class="flex items-center justify-between w-10/12 max-w-6xl m-0-auto">
        <span class="text-6xl text-left text-orange-700" id="logo">Our friends</span>

        <!-- button to allow a filtering by "any" or "cats" only, pretty much the asked "favorite views" -->
        <toggle-button
          :value="filterCatsOnly"
          @change="toggleFilterCatsOnly"
          :switch-color="{
            unchecked: 'linear-gradient(orange, red)',
            checked: 'linear-gradient(red, orange)',
          }"
          :color="{ checked: '#222', unchecked: '#333', disabled: 'red' }"
          :sync="true"
          :labels="{ checked: 'Cats', unchecked: 'All' }"
          :speed="500"
          :width="70"
          :height="30"
        />
      </div>
    </header>

    <!-- the component that will handle the lightbox with the given photos -->
    <silent-box
      @silentbox-overlay-opened="showPhotoInFullscreen"
      @silentbox-overlay-next-item-displayed="showPhotoInFullscreen"
      @silentbox-overlay-previous-item-displayed="showPhotoInFullscreen"
      @silentbox-overlay-hidden="hideFullscreen"
      ref="lightBox"
      :gallery="photosToDisplay"
    >
      <!-- each photo will be displayed here -->
      <template #silentbox-item="{ silentboxItem }">
        <div class="relative">
          <img :src="silentboxItem.src" :key="silentboxItem.id" />
          <div class="absolute bottom-0 pb-2 pl-4 flex text-orange-700 items-center">
            <!-- don't be rude ! 👇 💔 -->
            <template v-if="silentboxItem.likes > 0">
              {{ silentboxItem.likes }}<heart-svg class="w-4 h-4 ml-2"></heart-svg>
            </template>
          </div>
        </div>
      </template>
    </silent-box>

    <mugen-scroll class="pb-6" :handler="infiniteScrollFetchPhotos" :should-handle="!infiniteScrollLoading">
      Fetching friends... ❤️
    </mugen-scroll>
  </div>
</template>

<script>
import { pick, mapKeys } from 'lodash-es'
import MugenScroll from 'vue-mugen-scroll'
import HeartSvg from '../assets/svg/Heart'

export default {
  name: 'Home',
  components: {
    HeartSvg,
    MugenScroll,
  },
  data() {
    return {
      currentPage: 1,
      cuteAnimalPhotos: [],
      cuteCatPhotos: [],
      dominantColor: 'black',
      filterCatsOnly: false,
      imageType: 'photo',
      infiniteScrollLoading: false,
      isSafe: true,
      orderBy: 'latest',
      perPageCount: 25,
      searchQuery: 'cute+animal',
    }
  },
  async mounted() {
    // initial call to the API, further will be done thanks to the infinite scroll if needed
    this.cuteAnimalPhotos = await this.callPhotoApi()
  },
  methods: {
    async callPhotoApi() {
      // this is the API we gonna use for our images, with a lot of query params
      const { data: res, headers } = await this.$axios(
        `https://pixabay.com/api/?key=${process.env.VUE_APP_PIXABAY_API_KEY}&q=${this.searchQuery}&page=${this.currentPage}&safesearch=${this.isSafe}&per_page=${this.perPageCount}&order=${this.orderBy}&image_type=${this.imageType}&colors=${this.dominantColor}`
      )

      console.log(`Remaining calls to the API: ${headers['x-ratelimit-remaining']}`)

      const photosWithOnlyInterestingKeys = res.hits.map((photo) =>
        // the API gives us a lot of fields, only few are useful in our case
        pick(photo, [
          'id',
          'webformatURL',
          'webformatHeight',
          'webformatWidth',
          'largeImageURL',
          'tags',
          'user',
          'likes',
        ])
      )

      const normalizedPhotos = photosWithOnlyInterestingKeys.map((photo) => {
        const renamedPhotoFields = mapKeys(photo, (value, key) => {
          // for the lightbox, we need to setup some specific keys, hence the rename of the API fields
          switch (key) {
            case 'webformatURL':
              return 'thumbnail'
            case 'webformatHeight':
              return 'thumbnailHeight'
            case 'webformatWidth':
              return 'thumbnailWidth'
            case 'largeImageURL':
              return 'src'
            default:
              return key
          }
        })

        // we do create an array of tags as a property, rather than a basic string for futher Array.includes() usage
        renamedPhotoFields.tagsArray = renamedPhotoFields.tags.split(', ')

        // some other important fields for the slideshow
        renamedPhotoFields.alt = `Photo of ${renamedPhotoFields.tagsArray[0]}`
        renamedPhotoFields.description = `Photo taken by ${renamedPhotoFields.user}`

        // we do strip useless properties
        const { tags, user, ...normalizedPhotoFields } = renamedPhotoFields
        return normalizedPhotoFields
      })

      return normalizedPhotos
    },
    // emulates a third view with the image in high resolution
    showPhotoInFullscreen() {
      this.$router.push(`/fullscreen/${this.photosToDisplay[this.$refs.lightBox.overlay.currentItem].id}`)
    },
    // when we exit the lightbox
    hideFullscreen() {
      this.$router.push(this.filterCatsOnly ? '/?only-cats=true' : '/')
    },
    // toggle to only show the cats
    toggleFilterCatsOnly() {
      if (!this.filterCatsOnly) {
        this.cuteCatPhotos = this.cuteAnimalPhotos.filter((photo) => photo.tagsArray.includes('cat'))
        this.$router.push('/?only-cats=true')
      } else {
        this.$router.push('/')
      }
      this.filterCatsOnly = !this.filterCatsOnly
    },
    // fetch more photos if we do scroll at the end of the current page
    async infiniteScrollFetchPhotos() {
      this.infiniteScrollLoading = true

      // reset the "cats" toggle
      this.$router.push('/').catch((err) => {})
      this.filterCatsOnly = false

      // get the next page of the API
      this.currentPage++
      this.cuteAnimalPhotos = this.cuteAnimalPhotos.concat(await this.callPhotoApi())
      this.infiniteScrollLoading = false
    },
  },
  computed: {
    photosToDisplay() {
      // do not mutate the original array, use a "cat" specific one
      return this.filterCatsOnly ? this.cuteCatPhotos : this.cuteAnimalPhotos
    },
  },
}
</script>

<style lang="scss">
// import font Parisienne, with only the needed characters
@import url('https://fonts.googleapis.com/css2?family=Parisienne&display=swap&text=Ourfiends');

#logo {
  font-family: 'Parisienne';
}

#silentbox-gallery {
  columns: 1;
  @apply gap-4 mx-12 my-4 -mt-12;
}

// masonry display of the photos on all devices
@screen md {
  #silentbox-gallery {
    columns: 2;
  }
}

@screen lg {
  #silentbox-gallery {
    columns: 3;
  }
}

@screen xl {
  #silentbox-gallery {
    columns: 4;
  }
}

// image in the lightbox when fullscreen
#silentbox-overlay__container img {
  @apply rounded-lg;
}

// each image of the lightbox
.silentbox-item {
  @apply inline-block mb-4;
  img {
    @apply rounded-lg;
  }
}
</style>
