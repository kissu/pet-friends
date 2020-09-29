<template>
  <div class="home">
    <header style="background-color: #111;" class="bg-gray-900 h-48 pl-12 pt-8">
      <div class="flex items-center justify-between w-10/12 max-w-6xl m-0-auto">
        <span class="text-6xl text-left text-orange-700" id="logo">Our friends</span>
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
    <silent-box
      @silentbox-overlay-opened="showPhotoInFullscreen"
      @silentbox-overlay-next-item-displayed="showPhotoInFullscreen"
      @silentbox-overlay-previous-item-displayed="showPhotoInFullscreen"
      @silentbox-overlay-hidden="hideFullscreen"
      ref="lightBox"
      :gallery="photosToDisplay"
    >
      <template #silentbox-item="{ silentboxItem }">
        <div class="relative">
          <img :src="silentboxItem.src" :key="silentboxItem.id" />
          <div class="absolute bottom-0 pb-2 pl-4 flex text-orange-700 items-center">
            <template v-if="silentboxItem.likes > 0">
              {{ silentboxItem.likes }}<heart-svg class="w-4 h-4 ml-2"></heart-svg>
            </template>
          </div>
        </div>
      </template>
    </silent-box>
  </div>
</template>

<script>
import { pick, mapKeys } from 'lodash-es'
import HeartSvg from '../assets/svg/Heart'

export default {
  name: 'Home',
  components: {
    HeartSvg,
  },
  data() {
    return {
      currentPage: 1,
      cuteAnimalPhotos: [],
      cuteCatPhotos: [],
      dominantColor: 'black',
      filterCatsOnly: false,
      imageType: 'photo',
      isSafe: true,
      orderBy: 'latest',
      perPageCount: 20,
      searchQuery: 'cute+animal',
    }
  },
  async mounted() {
    // this is the API we gonna use for our images, a bit messy due to the query params..
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
    this.cuteAnimalPhotos = photosWithOnlyInterestingKeys.map((photo) => {
      const renamedPhotoFields = mapKeys(photo, (value, key) => {
        // for vue-silentbox, we need to setup some specific keys, hence the rename of the API fields
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

      // some other useful fields for the slideshow
      renamedPhotoFields.alt = `Photo of ${renamedPhotoFields.tagsArray[0]}`
      renamedPhotoFields.description = `Photo taken by ${renamedPhotoFields.user}`

      // we do strip useless properties
      const { tags, user, ...normalizedPhotoFields } = renamedPhotoFields
      return normalizedPhotoFields
    })
  },
  methods: {
    showPhotoInFullscreen() {
      this.$router.push(`/fullscreen/${this.photosToDisplay[this.$refs.lightBox.overlay.currentItem].id}`)
    },
    hideFullscreen() {
      this.$router.push(this.filterCatsOnly ? '/?only-cats=true' : '/')
    },
    toggleFilterCatsOnly() {
      // method to only show the cats
      if (!this.filterCatsOnly) {
        this.cuteCatPhotos = this.cuteAnimalPhotos.filter((photo) => photo.tagsArray.includes('cat'))
        this.$router.push('/?only-cats=true')
      } else {
        this.$router.push('/')
      }
      this.filterCatsOnly = !this.filterCatsOnly
    },
  },
  computed: {
    photosToDisplay() {
      // do not mutate the original array, use a cat specific one
      return this.filterCatsOnly ? this.cuteCatPhotos : this.cuteAnimalPhotos
    },
  },
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Parisienne&display=swap&text=Ourfiends');

#logo {
  font-family: 'Parisienne';
}

#silentbox-gallery {
  columns: 1;
  @apply gap-4 mx-12 my-4 -mt-12;
}

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

// image in the lightbox fullscreen
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
